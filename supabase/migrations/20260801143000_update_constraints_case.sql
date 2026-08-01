-- Update the role constraints to use UPPERCASE to match the research and requested SQL
-- This migration updates the existing tables applied in the previous steps.

-- Update profiles
alter table public.profiles drop constraint if exists profiles_role_check;
update public.profiles set role = upper(role);
alter table public.profiles add constraint profiles_role_check check (role in ('ADMIN', 'DM', 'PLAYER'));

-- Update handle_new_user function to default to 'PLAYER'
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    'PLAYER'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Update campaign_members
alter table public.campaign_members drop constraint if exists campaign_members_role_check;
update public.campaign_members set role = upper(role);
alter table public.campaign_members add constraint campaign_members_role_check check (role in ('DM', 'PLAYER'));

-- Update RLS policies for campaigns
drop policy if exists "Admins can do everything on campaigns" on public.campaigns;
create policy "Admins can do everything on campaigns"
  on public.campaigns for all
  using ((select role from public.profiles where id = auth.uid()) = 'ADMIN');

-- Update RLS policies for campaign_members
drop policy if exists "Admins can manage campaign members" on public.campaign_members;
create policy "Admins can manage campaign members"
  on public.campaign_members for all
  using ((select role from public.profiles where id = auth.uid()) = 'ADMIN');

-- Update RLS policies for entities
drop policy if exists "Admins can do everything on entities" on public.entities;
create policy "Admins can do everything on entities"
  on public.entities for all
  using ((select role from public.profiles where id = auth.uid()) = 'ADMIN');

drop policy if exists "Owners and DMs can view private/secret entities" on public.entities;
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