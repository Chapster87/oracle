-- Create characters table
create table public.characters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  species text,
  class text,
  alignment text,
  tags text[] default '{}',
  appearance text,
  personality text,
  role text,
  secrets text,
  is_deceased boolean default false,
  metadata jsonb default '{}'::jsonb,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  owner_id uuid references public.profiles(id),
  visibility text check (visibility in ('public', 'private', 'secret')) default 'public',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create locations table
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text, -- Settlement, Dungeon, Region, etc.
  sub_type text, -- City, Village, etc.
  region_id uuid references public.locations(id) on delete set null,
  tags text[] default '{}',
  overview text,
  history text,
  inhabitants text,
  points_of_interest jsonb default '[]'::jsonb,
  rumors_lore text[] default '{}',
  map_data text,
  metadata jsonb default '{}'::jsonb,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  owner_id uuid references public.profiles(id),
  visibility text check (visibility in ('public', 'private', 'secret')) default 'public',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create factions table
create table public.factions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  alignment text,
  tags text[] default '{}',
  overview text,
  goals text,
  beliefs text,
  metadata jsonb default '{}'::jsonb,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  owner_id uuid references public.profiles(id),
  visibility text check (visibility in ('public', 'private', 'secret')) default 'public',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create entity_relations join table (Polymorphic-ish relations)
create table public.entity_relations (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null,
  target_id uuid not null,
  relation_type text not null, -- 'member_of', 'located_in', 'ally_of', etc.
  created_at timestamp with time zone default now()
);

-- Create campaign_appearances join table
create table public.campaign_appearances (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null,
  episode_id uuid not null, -- Note: episodes table assumed to be created in later migration or exists
  created_at timestamp with time zone default now()
);

-- Set up RLS for characters
alter table public.characters enable row level security;

create policy "Admins can do everything on characters"
  on public.characters for all
  using ((select role from public.profiles where id = auth.uid()) = 'ADMIN');

create policy "Global knowledge is viewable by all"
  on public.characters for select
  using (campaign_id is null);

create policy "Campaign members can view public characters"
  on public.characters for select
  using (
    campaign_id in (select campaign_id from public.campaign_members where user_id = auth.uid())
    and visibility = 'public'
  );

create policy "Owners and DMs can view private/secret characters"
  on public.characters for select
  using (
    owner_id = auth.uid()
    or (
      campaign_id in (
        select campaign_id from public.campaign_members 
        where user_id = auth.uid() and role = 'DM'
      )
    )
  );

create policy "Owners and DMs can manage characters"
  on public.characters for all
  using (
    owner_id = auth.uid()
    or (
      campaign_id in (
        select campaign_id from public.campaign_members 
        where user_id = auth.uid() and role = 'DM'
      )
    )
  );

-- Set up RLS for locations
alter table public.locations enable row level security;

create policy "Admins can do everything on locations"
  on public.locations for all
  using ((select role from public.profiles where id = auth.uid()) = 'ADMIN');

create policy "Global knowledge is viewable by all"
  on public.locations for select
  using (campaign_id is null);

create policy "Campaign members can view public locations"
  on public.locations for select
  using (
    campaign_id in (select campaign_id from public.campaign_members where user_id = auth.uid())
    and visibility = 'public'
  );

create policy "Owners and DMs can view private/secret locations"
  on public.locations for select
  using (
    owner_id = auth.uid()
    or (
      campaign_id in (
        select campaign_id from public.campaign_members 
        where user_id = auth.uid() and role = 'DM'
      )
    )
  );

create policy "Owners and DMs can manage locations"
  on public.locations for all
  using (
    owner_id = auth.uid()
    or (
      campaign_id in (
        select campaign_id from public.campaign_members 
        where user_id = auth.uid() and role = 'DM'
      )
    )
  );

-- Set up RLS for factions
alter table public.factions enable row level security;

create policy "Admins can do everything on factions"
  on public.factions for all
  using ((select role from public.profiles where id = auth.uid()) = 'ADMIN');

create policy "Global knowledge is viewable by all"
  on public.factions for select
  using (campaign_id is null);

create policy "Campaign members can view public factions"
  on public.factions for select
  using (
    campaign_id in (select campaign_id from public.campaign_members where user_id = auth.uid())
    and visibility = 'public'
  );

create policy "Owners and DMs can view private/secret factions"
  on public.factions for select
  using (
    owner_id = auth.uid()
    or (
      campaign_id in (
        select campaign_id from public.campaign_members 
        where user_id = auth.uid() and role = 'DM'
      )
    )
  );

create policy "Owners and DMs can manage factions"
  on public.factions for all
  using (
    owner_id = auth.uid()
    or (
      campaign_id in (
        select campaign_id from public.campaign_members 
        where user_id = auth.uid() and role = 'DM'
      )
    )
  );

-- Triggers for updated_at
create trigger on_characters_updated
  before update on public.characters
  for each row execute procedure public.handle_updated_at();

create trigger on_locations_updated
  before update on public.locations
  for each row execute procedure public.handle_updated_at();

create trigger on_factions_updated
  before update on public.factions
  for each row execute procedure public.handle_updated_at();