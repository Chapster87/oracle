-- Secret slots are numbered, never named after a column.
--
-- A slot that came from marking a field records its source column, so
-- unmarking knows where to restore the value. The slot's name is always
-- `secret_N`, which keeps the data model and the UI consistent.
--
-- The legacy DM-only columns (`characters.secrets`, `locations.rumors_lore`)
-- became free-standing secrets, not marked fields, so they carry no source.

alter table public.entity_secret_slots
  add column if not exists source_column text;

with existing as (
  select
    entity_id,
    coalesce(max((regexp_match(slot, '^secret_(\d+)$'))[1]::int), 0) as max_n
  from public.entity_secret_slots
  group by entity_id
),
numbered as (
  select
    s.id,
    s.entity_id,
    row_number() over (
      partition by s.entity_id order by s.created_at, s.id
    ) as n
  from public.entity_secret_slots s
  where s.slot in ('secrets', 'rumors_lore')
)
update public.entity_secret_slots t
set slot = 'secret_' || (coalesce(e.max_n, 0) + numbered.n),
    source_column = null
from numbered
left join existing e on e.entity_id = numbered.entity_id
where t.id = numbered.id;
