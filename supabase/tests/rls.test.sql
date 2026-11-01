-- pgTAP allow/deny matrix for the RLS second gate (#50).
--
-- Everything runs in one transaction and rolls back, so it is safe against a
-- live database. Run with: node scripts/run-rls-tests.mjs (or `supabase test db`).

begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(23);

-- ---------------------------------------------------------------------------
-- Fixtures
-- ---------------------------------------------------------------------------

-- profiles.id references auth.users; the matrix only needs profile rows, and
-- this whole file rolls back.
alter table public.profiles drop constraint profiles_id_fkey;

insert into public.profiles (id, username, role) values
  ('00000000-0000-0000-0000-000000000001', 'rls_admin',    'ADMIN'),
  ('00000000-0000-0000-0000-000000000002', 'rls_dm',       'DM'),
  ('00000000-0000-0000-0000-000000000003', 'rls_player',   'PLAYER'),
  ('00000000-0000-0000-0000-000000000004', 'rls_outsider', 'PLAYER');

insert into public.campaigns (id, name, owner_id) values
  ('00000000-0000-0000-0000-000000000101', 'RLS Campaign One', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000102', 'RLS Campaign Two', '00000000-0000-0000-0000-000000000004');

insert into public.campaign_members (campaign_id, user_id, role) values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000003', 'PLAYER');

insert into public.entities (id, name, type, campaign_id, owner_id, visibility) values
  ('00000000-0000-0000-0000-000000001001', 'RLS Global Public',    'location', null, '00000000-0000-0000-0000-000000000002', 'public'),
  ('00000000-0000-0000-0000-000000001002', 'RLS Global Private',   'location', null, '00000000-0000-0000-0000-000000000002', 'private'),
  ('00000000-0000-0000-0000-000000001003', 'RLS Campaign Public',  'location', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000002', 'public'),
  ('00000000-0000-0000-0000-000000001004', 'RLS Campaign Private', 'location', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000002', 'private'),
  ('00000000-0000-0000-0000-000000001005', 'RLS Player Owned',     'location', null, '00000000-0000-0000-0000-000000000003', 'private'),
  ('00000000-0000-0000-0000-000000001006', 'RLS Other Campaign',   'location', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000004', 'public');

insert into public.entity_secret_slots (entity_id, slot, value, audience) values
  ('00000000-0000-0000-0000-000000001003', 'secret_1', '"dm only"'::jsonb, 'dm'),
  ('00000000-0000-0000-0000-000000001003', 'secret_2', '"for everyone"'::jsonb, 'public');

-- ---------------------------------------------------------------------------
-- SELECT: the read predicate
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001"}', true);
select is((select count(*) from public.entities where name like 'RLS %'), 6::bigint, 'ADMIN reads every entity');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000002"}', true);
select is((select count(*) from public.entities where name like 'RLS %'), 5::bigint, 'global DM reads globals and its own campaign, not another campaign');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000003"}', true);
select is((select count(*) from public.entities where name like 'RLS %'), 3::bigint, 'player reads public globals, its own row, and public campaign rows');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000004"}', true);
select is((select count(*) from public.entities where name like 'RLS %'), 2::bigint, 'outsider reads only what is public to it');
reset role;

-- Bug 1: a global private row must not leak to every authenticated user.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000004"}', true);
select is(
  (select count(*) from public.entities where id = '00000000-0000-0000-0000-000000001002'),
  0::bigint,
  'global private entity is invisible to a non-owner'
);
reset role;

-- Bug 2: campaign membership alone must not reveal a private row.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000003"}', true);
select is(
  (select count(*) from public.entities where id = '00000000-0000-0000-0000-000000001004'),
  0::bigint,
  'campaign member cannot read a private campaign entity'
);
reset role;

-- Bug 3: the membership policy must not recurse.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000003"}', true);
select is((select count(*) from public.campaign_members), 1::bigint, 'member reads its own membership row without recursion');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000004"}', true);
select is((select count(*) from public.campaign_members), 0::bigint, 'non-member reads no membership rows');
reset role;

-- ---------------------------------------------------------------------------
-- INSERT: the write predicate
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000003"}', true);
select throws_ok(
  $$ insert into public.entities (id, name, type, owner_id, visibility)
     values ('00000000-0000-0000-0000-000000002001', 'RLS Player Write', 'location',
             '00000000-0000-0000-0000-000000000003', 'private') $$,
  '42501', null, 'player cannot insert an entity'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000002"}', true);
select lives_ok(
  $$ insert into public.entities (id, name, type, owner_id, visibility)
     values ('00000000-0000-0000-0000-000000002002', 'RLS DM Global Write', 'location',
             '00000000-0000-0000-0000-000000000002', 'private') $$,
  'global DM inserts a global entity'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000002"}', true);
select lives_ok(
  $$ insert into public.entities (id, name, type, campaign_id, owner_id, visibility)
     values ('00000000-0000-0000-0000-000000002003', 'RLS DM Campaign Write', 'location',
             '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000002', 'private') $$,
  'campaign DM inserts into its own campaign'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000004"}', true);
select throws_ok(
  $$ insert into public.entities (id, name, type, campaign_id, owner_id, visibility)
     values ('00000000-0000-0000-0000-000000002004', 'RLS Outsider Write', 'location',
             '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000004', 'private') $$,
  '42501', null, 'outsider cannot insert into a campaign it does not run'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000001"}', true);
select lives_ok(
  $$ insert into public.entities (id, name, type, campaign_id, owner_id, visibility)
     values ('00000000-0000-0000-0000-000000002005', 'RLS Admin Campaign Write', 'location',
             '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'private') $$,
  'ADMIN inserts into any campaign'
);
reset role;

-- ---------------------------------------------------------------------------
-- UPDATE / DELETE
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000003"}', true);
with updated as (
  update public.entities set name = 'RLS Hijacked'
  where id = '00000000-0000-0000-0000-000000001001' returning 1
)
select is((select count(*) from updated), 0::bigint, 'player cannot update a public entity');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000002"}', true);
with updated as (
  update public.entities set name = 'RLS Renamed'
  where id = '00000000-0000-0000-0000-000000001004' returning 1
)
select is((select count(*) from updated), 1::bigint, 'campaign DM updates a private campaign entity');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000004"}', true);
with updated as (
  update public.entities set name = 'RLS Hijacked'
  where id = '00000000-0000-0000-0000-000000001003' returning 1
)
select is((select count(*) from updated), 0::bigint, 'outsider cannot update another campaign entity');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000003"}', true);
with deleted as (
  delete from public.entities where id = '00000000-0000-0000-0000-000000001001' returning 1
)
select is((select count(*) from deleted), 0::bigint, 'player cannot delete an entity');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000002"}', true);
with deleted as (
  delete from public.entities where id = '00000000-0000-0000-0000-000000001004' returning 1
)
select is((select count(*) from deleted), 1::bigint, 'campaign DM deletes a private campaign entity');
reset role;

-- ---------------------------------------------------------------------------
-- Secret slots
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000002"}', true);
select is((select count(*) from public.entity_secret_slots), 2::bigint, 'campaign DM reads every slot on its entity');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000003"}', true);
select is((select count(*) from public.entity_secret_slots), 1::bigint, 'player reads only public-audience slots');
reset role;

-- ---------------------------------------------------------------------------
-- Relations
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000002"}', true);
select throws_ok(
  $$ insert into public.entity_relations (source_id, target_id, relation_type)
     values ('00000000-0000-0000-0000-000000001003', '00000000-0000-0000-0000-000000001006', 'ally_of') $$,
  '42501', null, 'a relation cannot cross campaigns'
);
reset role;

-- ---------------------------------------------------------------------------
-- Profiles: no self-promotion
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000003"}', true);
select lives_ok(
  $$ update public.profiles set full_name = 'Renamed Player'
     where id = '00000000-0000-0000-0000-000000000003' $$,
  'a user may edit their own profile fields'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000003"}', true);
select throws_ok(
  $$ update public.profiles set role = 'ADMIN'
     where id = '00000000-0000-0000-0000-000000000003' $$,
  '42501', null, 'a user cannot promote themselves to ADMIN'
);
reset role;

select * from finish();

rollback;
