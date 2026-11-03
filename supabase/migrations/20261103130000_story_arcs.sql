-- Story arcs as a first-class entity (#69, per #33).
--
-- A story arc is a planning document that references the resources it
-- manifests. It lives in `entities` like every other content entity, so it
-- gets the draft/promote, visibility, and relation machinery for free.
--
-- `needed_resources` stores the template's major/minor resource list as
-- `{ major: [{ id, name, type }], minor: [{ name, type }] }`. The ids are the
-- pre-generated target ids from a batch's drafts, so the plan can reference a
-- resource before it is promoted.

create table public.story_arcs (
  id uuid primary key references public.entities(id) on delete cascade,
  name text not null,
  status text not null default 'planned'
    check (status in ('planned', 'active', 'completed')),
  target_level text,
  session_count integer,
  tags text[] default '{}',
  overview text,
  content text,
  needed_resources jsonb not null default '{"major":[],"minor":[]}'::jsonb,
  metadata jsonb default '{}'::jsonb,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  owner_id uuid references public.profiles(id),
  visibility text not null default 'private'
    check (visibility in ('public', 'private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger on_story_arcs_updated before update on public.story_arcs
  for each row execute procedure public.handle_updated_at();

alter table public.story_arcs enable row level security;
alter table public.story_arcs force row level security;

create policy story_arcs_select on public.story_arcs
  for select to authenticated
  using (private.can_view_row(campaign_id, visibility, owner_id));

create policy story_arcs_insert on public.story_arcs
  for insert to authenticated
  with check (private.can_write_scope(campaign_id));

create policy story_arcs_update on public.story_arcs
  for update to authenticated
  using (private.can_write_scope(campaign_id))
  with check (private.can_write_scope(campaign_id));

create policy story_arcs_delete on public.story_arcs
  for delete to authenticated
  using (private.can_write_scope(campaign_id));

grant select, insert, update, delete on public.story_arcs to authenticated;
grant select, insert, update, delete on public.story_arcs to service_role;

-- Add `story_arcs` to the atomic write allowlist.
create or replace function public.write_entity(
  p_model text,
  p_id uuid,
  p_payload jsonb,
  p_actor uuid,
  p_base_updated_at timestamptz default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_type text;
  v_unknown text[];
  v_cols text;
  v_payload jsonb;
  v_exists boolean;
  v_name text;
  v_campaign uuid;
  v_owner uuid;
  v_visibility text;
begin
  v_type := case p_model
    when 'characters' then 'character'
    when 'locations'  then 'location'
    when 'factions'   then 'faction'
    when 'players'    then 'player'
    when 'items'      then 'item'
    when 'religions'  then 'religion'
    when 'story_arcs' then 'story_arc'
    else null
  end;

  if v_type is null then
    raise exception 'Unknown entity model: %', p_model using errcode = '22023';
  end if;

  -- Reject unknown and immutable keys rather than passing them through.
  select array_agg(key) into v_unknown
  from jsonb_object_keys(p_payload) as key
  where key in ('id', 'type', 'created_at', 'updated_at')
     or not exists (
       select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name = p_model
         and column_name = key
     );

  if v_unknown is not null then
    raise exception 'Unknown or immutable fields for %: %', p_model,
      array_to_string(v_unknown, ', ') using errcode = '22023';
  end if;

  -- Start from the existing registry row, then let the payload override it.
  select e.name, e.campaign_id, e.owner_id, e.visibility
    into v_name, v_campaign, v_owner, v_visibility
  from public.entities e
  where e.id = p_id;

  v_exists := found;

  if p_payload ? 'name' then
    v_name := p_payload->>'name';
  end if;

  if p_payload ? 'campaign_id' then
    v_campaign := nullif(p_payload->>'campaign_id', '')::uuid;
  end if;

  if p_payload ? 'owner_id' then
    v_owner := nullif(p_payload->>'owner_id', '')::uuid;
  end if;

  if p_payload ? 'visibility' then
    v_visibility := p_payload->>'visibility';
  end if;

  v_owner := coalesce(v_owner, p_actor);
  v_visibility := coalesce(v_visibility, 'private');

  if v_name is null then
    raise exception 'name is required for %', p_model using errcode = '22023';
  end if;

  if v_exists and p_base_updated_at is not null then
    execute format(
      'select exists (select 1 from public.%I where id = $1 and updated_at = $2)',
      p_model
    ) into v_exists using p_id, p_base_updated_at;

    if not v_exists then
      raise exception 'Entity was modified by someone else' using errcode = 'PT409';
    end if;
  end if;

  insert into public.entities (id, name, type, campaign_id, owner_id, visibility)
  values (p_id, v_name, v_type, v_campaign, v_owner, v_visibility)
  on conflict (id) do update set
    name = excluded.name,
    campaign_id = excluded.campaign_id,
    owner_id = excluded.owner_id,
    visibility = excluded.visibility;

  -- Specialized row: only the columns the payload names, plus the resolved
  -- owner so the two tables cannot disagree about who owns the entity.
  v_payload := p_payload || jsonb_build_object('id', p_id, 'owner_id', v_owner);

  select string_agg(format('%I', key), ', ') into v_cols
  from jsonb_object_keys(v_payload) as key
  where key <> 'id';

  if v_exists then
    execute format(
      'update public.%I t set (%s) = (select %s from jsonb_populate_record(null::public.%I, $1) r) where t.id = $2',
      p_model, v_cols, v_cols, p_model
    ) using v_payload, p_id;
  else
    execute format(
      'insert into public.%I (id, %s) select id, %s from jsonb_populate_record(null::public.%I, $1) r',
      p_model, v_cols, v_cols, p_model
    ) using v_payload;
  end if;

  return p_id;
end;
$$;

revoke execute on function public.write_entity(text, uuid, jsonb, uuid, timestamptz)
  from public, anon;
grant execute on function public.write_entity(text, uuid, jsonb, uuid, timestamptz)
  to authenticated, service_role;
