-- Deletes a logical entity and everything that points at it.
--
-- `characters`, `locations`, and `factions` are standalone tables, so they are
-- deleted explicitly; the other specialized tables cascade from `entities`.
create or replace function public.delete_entity(p_entity_id uuid)
returns void
language plpgsql
security invoker
as $$
begin
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
