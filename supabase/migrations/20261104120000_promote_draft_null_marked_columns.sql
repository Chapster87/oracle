-- Carry secret slots through promotion (#46).
--
-- A slot op that marks a column (`source_column`) moves that value into the
-- slot, so the entity row must be written with the column nulled. Without this
-- the value would remain on the row and leak to players even though the slot
-- itself is hidden.
--
-- Only real columns are nulled, so a free-standing `secret_N` slot cannot
-- inject an unknown key into `write_entity`.

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

    -- A marked column is nulled on the entity row; the value lives in the slot.
    for v_op in select * from jsonb_array_elements(v_draft.slot_ops) loop
      if v_op->>'op' = 'upsert'
         and nullif(v_op->>'source_column', '') is not null
         and exists (
           select 1 from information_schema.columns
           where table_schema = 'public'
             and table_name = v_draft.model
             and column_name = v_op->>'source_column'
         )
      then
        v_payload := v_payload || jsonb_build_object(v_op->>'source_column', null);
      end if;
    end loop;

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
