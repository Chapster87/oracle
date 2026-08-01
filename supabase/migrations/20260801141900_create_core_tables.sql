-- Create campaigns table
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  owner_id uuid references public.profiles(id) not null
);

-- Create campaign_members table (linking users to campaigns)
create table public.campaign_members (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('DM', 'PLAYER')) default 'PLAYER',
  created_at timestamp with time zone default now(),
  unique(campaign_id, user_id)
);

-- Create entities table (Global Knowledge + Campaign Silos)
-- This table handles Characters, Locations, Factions, Items, etc.
create table public.entities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null, -- e.g., 'character', 'location', 'faction', 'item', 'religion'
  content text, -- Markdown content
  metadata jsonb default '{}'::jsonb,
  campaign_id uuid references public.campaigns(id) on delete cascade, -- null means global knowledge
  owner_id uuid references public.profiles(id),
  visibility text check (visibility in ('public', 'private', 'secret')) default 'public',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Set up RLS for campaigns
alter table public.campaigns enable row level security;

create policy "Admins can do everything on campaigns"
  on public.campaigns for all
  using ((select role from public.profiles where id = auth.uid()) = 'ADMIN');

create policy "Campaign members can view their campaigns"
  on public.campaigns for select
  using (
    id in (select campaign_id from public.campaign_members where user_id = auth.uid())
    or owner_id = auth.uid()
  );

-- Set up RLS for campaign_members
alter table public.campaign_members enable row level security;

create policy "Admins can manage campaign members"
  on public.campaign_members for all
  using ((select role from public.profiles where id = auth.uid()) = 'ADMIN');

create policy "Members can view other members in their campaign"
  on public.campaign_members for select
  using (
    campaign_id in (select campaign_id from public.campaign_members where user_id = auth.uid())
  );

-- Set up RLS for entities
alter table public.entities enable row level security;

create policy "Admins can do everything on entities"
  on public.entities for all
  using ((select role from public.profiles where id = auth.uid()) = 'ADMIN');

create policy "Global knowledge is viewable by all authenticated users"
  on public.entities for select
  using (campaign_id is null);

create policy "Campaign members can view public campaign entities"
  on public.entities for select
  using (
    campaign_id in (select campaign_id from public.campaign_members where user_id = auth.uid())
    and visibility = 'public'
  );

create policy "Owners and DMs can view private/secret entities"
  on public.entities for select
  using (
    owner_id = auth.uid()
    or (
      campaign_id in (
        select campaign_id from public.campaign_members 
        where user_id = auth.uid() and role = 'DM'
      )
    )
  );

-- Function to handle updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger on_campaigns_updated
  before update on public.campaigns
  for each row execute procedure public.handle_updated_at();

create trigger on_entities_updated
  before update on public.entities
  for each row execute procedure public.handle_updated_at();