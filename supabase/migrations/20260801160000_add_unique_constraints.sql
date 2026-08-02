-- Add unique constraint to entities to support upsert during migration
-- We use a COALESCE in a functional index for nullable columns if we want to handle nulls in unique constraints,
-- but for simplicity here we'll assume name is unique per campaign_id (including null).
-- Actually, a standard unique constraint on (name, campaign_id) treats NULL as distinct,
-- so you could have multiple entities with the same name if campaign_id is NULL.
-- To fix this for "Global" knowledge (campaign_id is null), we use a partial index or a clever constraint.

-- Standard unique constraint (Treats multiple NULLs as unique, which we don't want for Global entities)
alter table public.entities add constraint entities_name_campaign_id_key unique (name, campaign_id);

-- Add a partial unique index for Global Knowledge (where campaign_id is NULL)
-- This ensures only ONE Global entity can exist with a specific name.
create unique index entities_name_global_unique_idx on public.entities (name) where campaign_id is null;

-- Also add unique constraints to specialized tables if needed, 
-- but they use the same ID as entities, so primary key handles it.

-- Enable RLS on remaining tables
alter table public.campaign_appearances enable row level security;
alter table public.entity_relations enable row level security;

-- Policies for campaign_appearances
create policy "Admins can do everything on campaign_appearances"
  on public.campaign_appearances for all
  using ((select role from public.profiles where id = auth.uid()) = 'ADMIN');

create policy "Users can view appearances related to their campaigns"
  on public.campaign_appearances for select
  using (
    exists (
      select 1 from public.entities e
      where e.id = entity_id
      and (
        e.campaign_id is null
        or e.campaign_id in (select campaign_id from public.campaign_members where user_id = auth.uid())
      )
    )
  );

-- Policies for entity_relations
create policy "Admins can do everything on entity_relations"
  on public.entity_relations for all
  using ((select role from public.profiles where id = auth.uid()) = 'ADMIN');

create policy "Users can view relations related to their campaigns"
  on public.entity_relations for select
  using (
    exists (
      select 1 from public.entities e
      where (e.id = source_id or e.id = target_id)
      and (
        e.campaign_id is null
        or e.campaign_id in (select campaign_id from public.campaign_members where user_id = auth.uid())
      )
    )
  );
