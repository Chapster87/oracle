-- Drafts staging layer (#66, per #29, #31, #67).
--
-- A draft is a proposed entity change staged for DM review. It is never
-- player-visible and reaches the entity tables only through `promote_draft`.
-- `draft_batches` groups the drafts a single proposal run produced, so the
-- review rail can show them together.
--
-- `payload` is the entity-column patch exactly as `write_entity` accepts it.
-- `slot_ops` carries the secret-slot side of a mark/unmark, so a promotion
-- writes the entity row and its slots in one transaction.
--
-- `dm_edited_at` is set when the DM saves an edit; a re-propose of an edited
-- draft forks a sibling (`supersedes_id`) instead of overwriting it.

create table public.draft_batches (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade,
  created_by uuid references public.profiles(id),
  status text not null default 'open' check (status in ('open', 'closed')),
  plan_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  decided_at timestamptz
);

create table public.drafts (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('create', 'update', 'delete')),
  model text not null,
  target_id uuid not null,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  slot_ops jsonb not null default '[]'::jsonb,
  base_updated_at timestamptz,
  status text not null default 'pending'
    check (status in ('pending', 'promoted', 'discarded')),
  reason text,
  lane text,
  created_by uuid references public.profiles(id),
  decided_by uuid references public.profiles(id),
  decided_at timestamptz,
  dm_edited_at timestamptz,
  supersedes_id uuid references public.drafts(id) on delete set null,
  batch_id uuid not null references public.draft_batches(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index drafts_batch_id_idx on public.drafts (batch_id);
create index drafts_status_idx on public.drafts (status);
create index drafts_supersedes_id_idx on public.drafts (supersedes_id);

create trigger on_draft_batches_updated before update on public.draft_batches
  for each row execute procedure public.handle_updated_at();
create trigger on_drafts_updated before update on public.drafts
  for each row execute procedure public.handle_updated_at();

alter table public.draft_batches enable row level security;
alter table public.draft_batches force row level security;
alter table public.drafts enable row level security;
alter table public.drafts force row level security;

-- Visibility follows write authority over the destination scope (#39).
create policy draft_batches_select on public.draft_batches
  for select to authenticated
  using (private.can_write_scope(campaign_id));
create policy draft_batches_insert on public.draft_batches
  for insert to authenticated
  with check (private.can_write_scope(campaign_id));
create policy draft_batches_update on public.draft_batches
  for update to authenticated
  using (private.can_write_scope(campaign_id))
  with check (private.can_write_scope(campaign_id));
create policy draft_batches_delete on public.draft_batches
  for delete to authenticated
  using (private.can_write_scope(campaign_id));

create policy drafts_select on public.drafts
  for select to authenticated
  using (private.can_write_scope(campaign_id));
create policy drafts_insert on public.drafts
  for insert to authenticated
  with check (private.can_write_scope(campaign_id));
create policy drafts_update on public.drafts
  for update to authenticated
  using (private.can_write_scope(campaign_id))
  with check (private.can_write_scope(campaign_id));
create policy drafts_delete on public.drafts
  for delete to authenticated
  using (private.can_write_scope(campaign_id));

grant select, insert, update, delete on public.draft_batches to authenticated;
grant select, insert, update, delete on public.drafts to authenticated;
grant select, insert, update, delete on public.draft_batches to service_role;
grant select, insert, update, delete on public.drafts to service_role;

-- Promotes exactly one draft, in one transaction.
--
-- The draft is locked, re-authorized against the current session and target,
-- and checked against its `base_updated_at`. The entity row and its slot rows
-- are written together, so a failure leaves both untouched. Promoting one
-- draft discards its pending siblings in the same `supersedes_id` chain.
create or replace function public.promote_draft(p_draft_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_draft public.drafts%rowtype;
  v_payload jsonb;
  v_entity_id uuid;
  v_missing_id uuid;
  v_missing_name text;
  v_owner uuid;
  v_op jsonb;
begin
  select * into v_draft
  from public.drafts
  where id = p_draft_id
  for update;

  if not found then
    raise exception 'Draft not found' using errcode = 'P0002';
  end if;

  if v_draft.status <> 'pending' then
    raise exception 'Draft is already %', v_draft.status using errcode = 'PT409';
  end if;

  if not private.can_write_scope(v_draft.campaign_id) then
    raise exception 'You cannot promote that draft' using errcode = '42501';
  end if;

  if v_draft.kind in ('update', 'delete') then
    if not private.can_write_entity(v_draft.target_id) then
      raise exception 'You cannot write that entity' using errcode = '42501';
    end if;

    if v_draft.base_updated_at is not null and not exists (
      select 1 from public.entities e
      where e.id = v_draft.target_id
        and e.updated_at = v_draft.base_updated_at
    ) then
      raise exception 'Entity was modified by someone else' using errcode = 'PT409';
    end if;
  end if;

  -- A reference to an entity that is not live yet fails closed and names it.
  if v_draft.kind in ('create', 'update') then
    select p.value::uuid into v_missing_id
    from jsonb_each_text(v_draft.payload) as p(key, value)
    where p.key in ('region_id', 'homeland_id', 'hometown_id', 'location_id')
      and p.value is not null
      and p.value <> ''
      and not exists (
        select 1 from public.entities e where e.id = p.value::uuid
      )
    limit 1;

    if v_missing_id is not null then
      select e.name into v_missing_name
      from public.entities e
      where e.id = v_missing_id;

      raise exception 'Promote the referenced entity first: %',
        coalesce(v_missing_name, v_missing_id::text)
        using errcode = 'PT422';
    end if;
  end if;

  if v_draft.kind = 'delete' then
    perform public.delete_entity(v_draft.target_id);
    v_entity_id := v_draft.target_id;
  else
    -- The draft's destination scope is authoritative, so it is merged into the
    -- payload rather than trusting the payload to carry it.
    v_payload := v_draft.payload
      || jsonb_build_object('campaign_id', v_draft.campaign_id);

    v_entity_id := public.write_entity(
      v_draft.model,
      v_draft.target_id,
      v_payload,
      coalesce(auth.uid(), v_draft.created_by),
      v_draft.base_updated_at
    );
  end if;

  if v_draft.kind <> 'delete' then
    select e.owner_id into v_owner
    from public.entities e
    where e.id = v_entity_id;

    for v_op in select * from jsonb_array_elements(v_draft.slot_ops) loop
      if v_op->>'op' = 'delete' then
        delete from public.entity_secret_slots
        where entity_id = v_entity_id and slot = v_op->>'slot';
      else
        insert into public.entity_secret_slots (
          entity_id, slot, source_column, value, audience, revealed_at,
          position, owner_id
        ) values (
          v_entity_id,
          v_op->>'slot',
          nullif(v_op->>'source_column', ''),
          v_op->'value',
          coalesce(v_op->>'audience', 'dm'),
          nullif(v_op->>'revealed_at', '')::timestamptz,
          coalesce((v_op->>'position')::int, 0),
          v_owner
        )
        on conflict (entity_id, slot) do update set
          source_column = excluded.source_column,
          value = excluded.value,
          audience = excluded.audience,
          revealed_at = excluded.revealed_at,
          position = excluded.position,
          owner_id = excluded.owner_id,
          updated_at = now();
      end if;
    end loop;
  end if;

  update public.drafts
  set status = 'promoted',
      decided_by = auth.uid(),
      decided_at = now(),
      updated_at = now()
  where id = p_draft_id;

  -- The whole fork chain loses to the promoted version.
  with recursive chain as (
    select id, supersedes_id from public.drafts where id = p_draft_id
    union
    select d.id, d.supersedes_id
    from public.drafts d
    join chain c on d.id = c.supersedes_id or d.supersedes_id = c.id
  )
  update public.drafts
  set status = 'discarded',
      reason = 'superseded',
      decided_by = auth.uid(),
      decided_at = now(),
      updated_at = now()
  where id in (select id from chain)
    and id <> p_draft_id
    and status = 'pending';

  return v_entity_id;
end;
$$;

revoke execute on function public.promote_draft(uuid) from public, anon;
grant execute on function public.promote_draft(uuid) to authenticated, service_role;
