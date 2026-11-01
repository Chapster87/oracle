-- RLS as a second enforcement gate (#50).
--
-- One canonical predicate lives in the `private` schema and every policy is
-- written from it, so the SQL gate and the TypeScript gate cannot drift. The
-- `private` schema is not exposed by PostgREST.
--
-- Fixes the three known policy bugs:
--   1. global private rows were visible to every authenticated user;
--   2. campaign members saw private rows because `visibility` was ignored;
--   3. `campaign_members` had a self-referential SELECT policy (42P17).
--
-- Also closes a privilege escalation: `profiles` UPDATE was table-wide, so a
-- user could set their own `role` to ADMIN. It is now column-scoped.

-- ---------------------------------------------------------------------------
-- 1. Predicates
-- ---------------------------------------------------------------------------

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'ADMIN'
  );
$$;

create or replace function private.is_dm()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'DM'
  );
$$;

/** Campaign owner or a member whose membership role is DM. */
create or replace function private.is_campaign_dm(p_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.campaigns
    where id = p_campaign_id and owner_id = (select auth.uid())
  ) or exists (
    select 1 from public.campaign_members
    where campaign_id = p_campaign_id
      and user_id = (select auth.uid())
      and role = 'DM'
  );
$$;

/** Campaign owner or any member, regardless of membership role. */
create or replace function private.is_campaign_member(p_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.campaigns
    where id = p_campaign_id and owner_id = (select auth.uid())
  ) or exists (
    select 1 from public.campaign_members
    where campaign_id = p_campaign_id and user_id = (select auth.uid())
  );
$$;

/**
 * The read predicate, evaluated against a row's own columns so entity tables
 * never pay for a lookup on `entities`.
 *
 * ADMIN reads everything. A global entity is readable by a global DM, or by
 * anyone it is public to or who owns it. A campaign entity is readable by that
 * campaign's DM, or by a member when it is public to them or they own it.
 */
create or replace function private.can_view_row(
  p_campaign_id uuid,
  p_visibility text,
  p_owner_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when private.is_admin() then true
    when p_campaign_id is null then
      case
        when private.is_dm() then true
        else p_visibility = 'public' or p_owner_id = (select auth.uid())
      end
    else
      case
        when private.is_campaign_dm(p_campaign_id) then true
        when private.is_campaign_member(p_campaign_id) then
          p_visibility = 'public' or p_owner_id = (select auth.uid())
        else false
      end
  end;
$$;

/** The same predicate for a table that only knows an entity id. */
create or replace function private.can_view_entity(p_entity_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select private.can_view_row(e.campaign_id, e.visibility, e.owner_id)
    from public.entities e
    where e.id = p_entity_id
  ), false);
$$;

/**
 * The write predicate: ADMIN anywhere, a global DM for global rows, and a
 * campaign DM for that campaign. Ownership is visibility, never a write grant.
 */
create or replace function private.can_write_scope(p_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when private.is_admin() then true
    when p_campaign_id is null then private.is_dm()
    else private.is_campaign_dm(p_campaign_id)
  end;
$$;

/** The write predicate for a table that only knows an entity id. */
create or replace function private.can_write_entity(p_entity_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select private.can_write_scope(e.campaign_id)
    from public.entities e
    where e.id = p_entity_id
  ), false);
$$;

/**
 * Relations may not cross campaigns: both endpoints must share a campaign, or
 * one of them must be global (#41).
 */
create or replace function private.relation_scope_ok(
  p_source_id uuid,
  p_target_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.entities s
    join public.entities t on t.id = p_target_id
    where s.id = p_source_id
      and (
        s.campaign_id is null
        or t.campaign_id is null
        or s.campaign_id = t.campaign_id
      )
  );
$$;

revoke execute on function private.is_admin() from public, anon;
revoke execute on function private.is_dm() from public, anon;
revoke execute on function private.is_campaign_dm(uuid) from public, anon;
revoke execute on function private.is_campaign_member(uuid) from public, anon;
revoke execute on function private.can_view_row(uuid, text, uuid) from public, anon;
revoke execute on function private.can_view_entity(uuid) from public, anon;
revoke execute on function private.can_write_scope(uuid) from public, anon;
revoke execute on function private.can_write_entity(uuid) from public, anon;
revoke execute on function private.relation_scope_ok(uuid, uuid) from public, anon;

grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_dm() to authenticated;
grant execute on function private.is_campaign_dm(uuid) to authenticated;
grant execute on function private.is_campaign_member(uuid) to authenticated;
grant execute on function private.can_view_row(uuid, text, uuid) to authenticated;
grant execute on function private.can_view_entity(uuid) to authenticated;
grant execute on function private.can_write_scope(uuid) to authenticated;
grant execute on function private.can_write_entity(uuid) to authenticated;
grant execute on function private.relation_scope_ok(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Slot ownership column (needed by the slot policy below)
-- ---------------------------------------------------------------------------

-- Slots carry a denormalized owner so the audience check needs no join.
alter table public.entity_secret_slots
  add column if not exists owner_id uuid;

update public.entity_secret_slots s
set owner_id = e.owner_id
from public.entities e
where e.id = s.entity_id and s.owner_id is null;

-- ---------------------------------------------------------------------------
-- 3. Replace every policy
-- ---------------------------------------------------------------------------

do $$
declare
  p record;
begin
  for p in
    select tablename, policyname from pg_policies where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- Entity tables share one shape: read by predicate, write by scope.
do $$
declare
  t text;
  tables text[] := array[
    'entities', 'characters', 'locations', 'factions', 'players', 'items',
    'religions', 'puzzles', 'quest_hooks', 'world_lore', 'campaign_logs'
  ];
begin
  foreach t in array tables loop
    execute format(
      'create policy %I on public.%I for select to authenticated
         using (private.can_view_row(campaign_id, visibility, owner_id))',
      t || '_select', t
    );

    execute format(
      'create policy %I on public.%I for insert to authenticated
         with check (private.can_write_scope(campaign_id))',
      t || '_insert', t
    );

    execute format(
      'create policy %I on public.%I for update to authenticated
         using (private.can_write_scope(campaign_id))
         with check (private.can_write_scope(campaign_id))',
      t || '_update', t
    );

    execute format(
      'create policy %I on public.%I for delete to authenticated
         using (private.can_write_scope(campaign_id))',
      t || '_delete', t
    );
  end loop;
end $$;

-- Campaigns: members read, campaign DMs write, a DM may create one they own.
create policy campaigns_select on public.campaigns
  for select to authenticated
  using (private.is_admin() or private.is_campaign_member(id));

create policy campaigns_insert on public.campaigns
  for insert to authenticated
  with check (
    private.is_admin()
    or (private.is_dm() and owner_id = (select auth.uid()))
  );

create policy campaigns_update on public.campaigns
  for update to authenticated
  using (private.is_admin() or private.is_campaign_dm(id))
  with check (private.is_admin() or private.is_campaign_dm(id));

create policy campaigns_delete on public.campaigns
  for delete to authenticated
  using (private.is_admin() or private.is_campaign_dm(id));

-- Membership: readable by fellow members (via a definer helper, so the policy
-- no longer selects from its own table), writable by campaign DMs.
create policy campaign_members_select on public.campaign_members
  for select to authenticated
  using (private.is_admin() or private.is_campaign_member(campaign_id));

create policy campaign_members_insert on public.campaign_members
  for insert to authenticated
  with check (private.is_admin() or private.is_campaign_dm(campaign_id));

create policy campaign_members_update on public.campaign_members
  for update to authenticated
  using (private.is_admin() or private.is_campaign_dm(campaign_id))
  with check (private.is_admin() or private.is_campaign_dm(campaign_id));

create policy campaign_members_delete on public.campaign_members
  for delete to authenticated
  using (private.is_admin() or private.is_campaign_dm(campaign_id));

-- Profiles: readable by the signed-in app, self-writable. The column-level
-- grant below is what stops a user promoting themselves to ADMIN.
create policy profiles_select on public.profiles
  for select to authenticated
  using (true);

create policy profiles_insert on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

create policy profiles_update on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Relations: an assertion by the source's writer about a target they can read,
-- and never across campaigns (#41).
create policy entity_relations_select on public.entity_relations
  for select to authenticated
  using (
    private.can_view_entity(source_id) and private.can_view_entity(target_id)
  );

create policy entity_relations_insert on public.entity_relations
  for insert to authenticated
  with check (
    private.can_write_entity(source_id)
    and private.can_view_entity(target_id)
    and private.relation_scope_ok(source_id, target_id)
  );

create policy entity_relations_update on public.entity_relations
  for update to authenticated
  using (private.can_write_entity(source_id))
  with check (
    private.can_write_entity(source_id)
    and private.can_view_entity(target_id)
    and private.relation_scope_ok(source_id, target_id)
  );

create policy entity_relations_delete on public.entity_relations
  for delete to authenticated
  using (private.can_write_entity(source_id));

-- Appearances follow the entity they point at.
create policy campaign_appearances_select on public.campaign_appearances
  for select to authenticated
  using (private.can_view_entity(entity_id));

create policy campaign_appearances_insert on public.campaign_appearances
  for insert to authenticated
  with check (private.can_write_entity(entity_id));

create policy campaign_appearances_update on public.campaign_appearances
  for update to authenticated
  using (private.can_write_entity(entity_id))
  with check (private.can_write_entity(entity_id));

create policy campaign_appearances_delete on public.campaign_appearances
  for delete to authenticated
  using (private.can_write_entity(entity_id));

-- Secret slots: the entity is the outer gate, then the audience decides.
create policy entity_secret_slots_select on public.entity_secret_slots
  for select to authenticated
  using (
    private.can_view_entity(entity_id)
    and (
      private.can_write_entity(entity_id)
      or audience = 'public'
      or (audience = 'owner' and owner_id = (select auth.uid()))
    )
  );

create policy entity_secret_slots_insert on public.entity_secret_slots
  for insert to authenticated
  with check (private.can_write_entity(entity_id));

create policy entity_secret_slots_update on public.entity_secret_slots
  for update to authenticated
  using (private.can_write_entity(entity_id))
  with check (private.can_write_entity(entity_id));

create policy entity_secret_slots_delete on public.entity_secret_slots
  for delete to authenticated
  using (private.can_write_entity(entity_id));

-- ---------------------------------------------------------------------------
-- 4. Grants, force, slot sync, indexes
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;

grant select, insert, update, delete on
  public.entities,
  public.characters,
  public.locations,
  public.factions,
  public.players,
  public.items,
  public.religions,
  public.puzzles,
  public.quest_hooks,
  public.world_lore,
  public.campaign_logs,
  public.campaigns,
  public.campaign_members,
  public.entity_relations,
  public.campaign_appearances,
  public.entity_secret_slots
to authenticated;

-- `role` is deliberately absent: a user may edit their profile, not their rank.
grant select, insert on public.profiles to authenticated;
grant update (username, full_name, avatar_url) on public.profiles to authenticated;

do $$
declare
  t text;
  tables text[] := array[
    'entities', 'characters', 'locations', 'factions', 'players', 'items',
    'religions', 'puzzles', 'quest_hooks', 'world_lore', 'campaign_logs',
    'campaigns', 'campaign_members', 'entity_relations',
    'campaign_appearances', 'entity_secret_slots', 'profiles'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;

create or replace function private.sync_secret_slot_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.owner_id := (
    select owner_id from public.entities where id = new.entity_id
  );
  return new;
end;
$$;

drop trigger if exists on_entity_secret_slots_owner on public.entity_secret_slots;
create trigger on_entity_secret_slots_owner
  before insert or update of entity_id on public.entity_secret_slots
  for each row execute function private.sync_secret_slot_owner();

create or replace function private.propagate_secret_slot_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.entity_secret_slots
  set owner_id = new.owner_id
  where entity_id = new.id;
  return new;
end;
$$;

drop trigger if exists on_entities_owner_sync on public.entities;
create trigger on_entities_owner_sync
  after update of owner_id on public.entities
  for each row execute function private.propagate_secret_slot_owner();

do $$
declare
  t text;
  tables text[] := array[
    'entities', 'characters', 'locations', 'factions', 'players', 'items',
    'religions', 'puzzles', 'quest_hooks', 'world_lore', 'campaign_logs'
  ];
begin
  foreach t in array tables loop
    execute format(
      'create index if not exists %I on public.%I (owner_id)',
      t || '_owner_id_idx', t
    );
    execute format(
      'create index if not exists %I on public.%I (campaign_id)',
      t || '_campaign_id_idx', t
    );
  end loop;
end $$;

create index if not exists campaign_members_user_id_idx
  on public.campaign_members (user_id);
