-- Players carry auxiliary key/value data (e.g. a D&D Beyond sheet URL) in
-- `metadata`, matching the other entity tables.
alter table public.players
  add column metadata jsonb default '{}'::jsonb;
