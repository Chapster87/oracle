-- Collapse visibility to public | private and default to private (#44).
--
-- Every entity table carried a three-value enum with a `public` default, so a
-- write that omitted `visibility` silently became world-readable. Narrowing to
-- two values and defaulting to `private` makes every write entry point fail
-- closed. No rows currently hold `secret` and none are null, so this is a
-- constraint/default change with no data movement.

do $$
declare
  t text;
begin
  foreach t in array array[
    'entities',
    'characters',
    'locations',
    'factions',
    'players',
    'items',
    'religions',
    'puzzles',
    'quest_hooks',
    'world_lore',
    'campaign_logs'
  ]
  loop
    execute format(
      'update public.%I set visibility = %L where visibility is null or visibility = %L',
      t, 'private', 'secret'
    );

    execute format(
      'alter table public.%I drop constraint if exists %I',
      t, t || '_visibility_check'
    );

    execute format(
      'alter table public.%I alter column visibility set default %L',
      t, 'private'
    );

    execute format(
      'alter table public.%I alter column visibility set not null',
      t
    );

    execute format(
      'alter table public.%I add constraint %I check (visibility in (%L, %L))',
      t, t || '_visibility_check', 'public', 'private'
    );
  end loop;
end $$;
