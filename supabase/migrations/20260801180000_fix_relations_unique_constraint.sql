-- Add unique constraint to entity_relations to support upsert
alter table public.entity_relations add constraint entity_relations_source_target_type_key unique (source_id, target_id, relation_type);