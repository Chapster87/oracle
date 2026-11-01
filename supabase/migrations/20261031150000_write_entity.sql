-- Atomic entity writes (#63, per #40).
--
-- A logical entity lives in `entities` (the registry) and in exactly one
-- specialized table, both keyed by the same id. PostgREST cannot span two
-- statements, so both writes happen here, in one transaction.
--
-- `p_base_updated_at` is the optimistic-concurrency token: when supplied, the
-- specialized row must still carry it or the write raises `PT409`.
--
-- Registry values are resolved from the existing row first, so a partial update
-- never nulls `name`, reassigns `owner_id`, or moves the entity's scope.
--
-- `entities.type` stores singular values (`character`), while the app's model
-- names are plural (`characters`); the mapping is explicit below.

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
