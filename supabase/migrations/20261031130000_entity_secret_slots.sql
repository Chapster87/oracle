-- Per-row secret slots with audience filtering (#45).
--
-- A value can be withheld from players — including the owning player — until
-- revealed. `audience` is the current audience; `revealed_at` records when it
-- was raised and is cleared when it returns to `dm`. Entity visibility stays the
-- outer gate: a slot is never returned to a viewer who cannot see the row.
--
-- `entity_id` is polymorphic (the specialized tables hold the real rows), so
-- there is no FK and `delete_entity` purges slots explicitly.
--
-- RLS is enabled with no policies on purpose: the DAL filters by audience in
-- TypeScript (#22), and #42 adds the canonical slot policy alongside the rest.

create table public.entity_secret_slots (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null,
  slot text not null,
  value jsonb,
  audience text not null default 'dm'
    check (audience in ('dm', 'owner', 'public')),
  revealed_at timestamptz,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_id, slot)
);

create index entity_secret_slots_entity_id_idx
  on public.entity_secret_slots (entity_id);

alter table public.entity_secret_slots enable row level security;

-- The DAL reads slots through the service-role client, which bypasses RLS but
-- still needs table privileges. `authenticated` is granted alongside the
-- policies in #42, not here.
grant select, insert, update, delete
  on public.entity_secret_slots to service_role;

-- Migrate the two fixed DM-only columns into slots, then null them. The slot
-- name matches the column so the read path can overlay it back onto the row.
-- Empty values carry no information and are skipped.
insert into public.entity_secret_slots (entity_id, slot, value, audience)
select id, 'secrets', to_jsonb(secrets), 'dm'
from public.characters
where secrets is not null and btrim(secrets) <> '';

insert into public.entity_secret_slots (entity_id, slot, value, audience)
select id, 'rumors_lore', to_jsonb(rumors_lore), 'dm'
from public.locations
where rumors_lore is not null and cardinality(rumors_lore) > 0;

update public.characters set secrets = null where secrets is not null;
update public.locations set rumors_lore = null where rumors_lore is not null;

-- Slots are polymorphic, so the delete function purges them explicitly.
create or replace function public.delete_entity(p_entity_id uuid)
returns void
language plpgsql
security invoker
as $$
begin
  delete from public.entity_secret_slots where entity_id = p_entity_id;

  delete from public.entity_relations
    where source_id = p_entity_id or target_id = p_entity_id;

  delete from public.campaign_appearances
    where entity_id = p_entity_id;

  delete from public.characters where id = p_entity_id;
  delete from public.locations where id = p_entity_id;
  delete from public.factions where id = p_entity_id;

  delete from public.entities where id = p_entity_id;
end;
$$;

revoke execute on function public.delete_entity(uuid) from public, anon;
grant execute on function public.delete_entity(uuid) to authenticated, service_role;
