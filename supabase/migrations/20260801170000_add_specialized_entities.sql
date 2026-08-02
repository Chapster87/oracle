-- Create players table (distinct from characters/NPCs)
create table public.players (
  id uuid primary key references public.entities(id) on delete cascade,
  name text not null,
  species text,
  class_es text,
  alignment text,
  level integer,
  homeland_id uuid references public.locations(id) on delete set null,
  hometown_id uuid references public.locations(id) on delete set null,
  background text,
  backstory text,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  owner_id uuid references public.profiles(id),
  visibility text check (visibility in ('public', 'private', 'secret')) default 'public',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create items table
create table public.items (
  id uuid primary key references public.entities(id) on delete cascade,
  name text not null,
  type text,
  rarity text,
  tags text[] default '{}',
  description text,
  history text,
  role_in_campaign text,
  metadata jsonb default '{}'::jsonb,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  owner_id uuid references public.profiles(id),
  visibility text check (visibility in ('public', 'private', 'secret')) default 'public',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create religions table
create table public.religions (
  id uuid primary key references public.entities(id) on delete cascade,
  name text not null,
  type text,
  tags text[] default '{}',
  overview text,
  domains_teachings text,
  worship_rituals text,
  clergy_followers text,
  history_myths text,
  role_in_campaign text,
  metadata jsonb default '{}'::jsonb,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  owner_id uuid references public.profiles(id),
  visibility text check (visibility in ('public', 'private', 'secret')) default 'public',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create puzzles table
create table public.puzzles (
  id uuid primary key references public.entities(id) on delete cascade,
  name text not null,
  status text,
  type text,
  tags text[] default '{}',
  overview text,
  puzzle_details text,
  solution text,
  failure text,
  location_id uuid references public.locations(id) on delete set null,
  metadata jsonb default '{}'::jsonb,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  owner_id uuid references public.profiles(id),
  visibility text check (visibility in ('public', 'private', 'secret')) default 'public',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create quest_hooks table
create table public.quest_hooks (
  id uuid primary key references public.entities(id) on delete cascade,
  name text not null,
  status text,
  description text,
  suggested_encounters jsonb default '{}'::jsonb,
  location_id uuid references public.locations(id) on delete set null,
  metadata jsonb default '{}'::jsonb,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  owner_id uuid references public.profiles(id),
  visibility text check (visibility in ('public', 'private', 'secret')) default 'public',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create world_lore table
create table public.world_lore (
  id uuid primary key references public.entities(id) on delete cascade,
  name text not null,
  content text,
  metadata jsonb default '{}'::jsonb,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  owner_id uuid references public.profiles(id),
  visibility text check (visibility in ('public', 'private', 'secret')) default 'public',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create campaign_logs table
create table public.campaign_logs (
  id uuid primary key references public.entities(id) on delete cascade,
  name text not null,
  content text,
  metadata jsonb default '{}'::jsonb,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  owner_id uuid references public.profiles(id),
  visibility text check (visibility in ('public', 'private', 'secret')) default 'public',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Set up RLS
alter table public.players enable row level security;
alter table public.items enable row level security;
alter table public.religions enable row level security;
alter table public.puzzles enable row level security;
alter table public.quest_hooks enable row level security;
alter table public.world_lore enable row level security;
alter table public.campaign_logs enable row level security;

-- Example policies
create policy "Admins can do everything on players" on public.players for all using ((select role from public.profiles where id = auth.uid()) = 'ADMIN');
create policy "Global knowledge viewable on players" on public.players for select using (campaign_id is null);

create policy "Admins can do everything on items" on public.items for all using ((select role from public.profiles where id = auth.uid()) = 'ADMIN');
create policy "Global knowledge viewable on items" on public.items for select using (campaign_id is null);

create policy "Admins can do everything on religions" on public.religions for all using ((select role from public.profiles where id = auth.uid()) = 'ADMIN');
create policy "Global knowledge viewable on religions" on public.religions for select using (campaign_id is null);

create policy "Admins can do everything on puzzles" on public.puzzles for all using ((select role from public.profiles where id = auth.uid()) = 'ADMIN');
create policy "Global knowledge viewable on puzzles" on public.puzzles for select using (campaign_id is null);

create policy "Admins can do everything on quest_hooks" on public.quest_hooks for all using ((select role from public.profiles where id = auth.uid()) = 'ADMIN');
create policy "Global knowledge viewable on quest_hooks" on public.quest_hooks for select using (campaign_id is null);

create policy "Admins can do everything on world_lore" on public.world_lore for all using ((select role from public.profiles where id = auth.uid()) = 'ADMIN');
create policy "Global knowledge viewable on world_lore" on public.world_lore for select using (campaign_id is null);

create policy "Admins can do everything on campaign_logs" on public.campaign_logs for all using ((select role from public.profiles where id = auth.uid()) = 'ADMIN');
create policy "Global knowledge viewable on campaign_logs" on public.campaign_logs for select using (campaign_id is null);

-- Triggers for updated_at
create trigger on_players_updated before update on public.players for each row execute procedure public.handle_updated_at();
create trigger on_items_updated before update on public.items for each row execute procedure public.handle_updated_at();
create trigger on_religions_updated before update on public.religions for each row execute procedure public.handle_updated_at();
create trigger on_puzzles_updated before update on public.puzzles for each row execute procedure public.handle_updated_at();
create trigger on_quest_hooks_updated before update on public.quest_hooks for each row execute procedure public.handle_updated_at();
create trigger on_world_lore_updated before update on public.world_lore for each row execute procedure public.handle_updated_at();
create trigger on_campaign_logs_updated before update on public.campaign_logs for each row execute procedure public.handle_updated_at();