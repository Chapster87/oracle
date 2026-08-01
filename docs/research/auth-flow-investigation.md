# Research: Authentication Flow for Players vs DM

## Destination

A secure, scalable authentication system using Supabase Auth that distinguishes between Dungeon Master (DM) and Player roles, providing appropriate access to 'Second Brain' data.

## Proposed Authentication Method: Supabase Auth

Supabase Auth is the recommended solution for its deep integration with the database and Row Level Security (RLS).

### Primary Flow: Magic Links

- **Reasoning**: Lowest friction for players. No passwords to remember.
- **Experience**: User enters email -> clicks link in email -> logged into Oracle.
- **Onboarding**:
  - DM invites players via email.
  - Initial login creates a record in a `profiles` or `users` table.

## Role Assignment Logic

We need a robust way to map Supabase Auth users to application roles (`ADMIN`, `DM` vs `PLAYER`).

### 1. Database Schema (Supabase)

Create a `profiles` table in the `public` schema that mirrors `auth.users`.

```sql
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  role text check (role in ('ADMIN', 'DM', 'PLAYER')) default 'PLAYER',
  updated_at timestamp with time zone
);
```

### 2. Assignment Strategies

- **Admin Setup**: Define an `ADMIN` role manually for the first user to allow management of `DM` and `PLAYER` roles.
- **Invite-Based**: The DM generates invite links or adds player emails to a "Whitelist" with the `PLAYER` role pre-assigned.
- **Claims (JWT)**: Use Supabase custom claims or `app_metadata` to store the role directly in the JWT for faster client-side/Edge checks without a database hit.

## Security & Data Access (Second Brain)

'Second Brain' data is partitioned into Global Knowledge and Campaign Silos.

### Row Level Security (RLS) Rules

- **Global Knowledge**:
  - `DM`/`ADMIN`: ALL (Select, Insert, Update, Delete).
  - `PLAYER`: Select only.
- **Campaign Silos**:
  - `DM`/`ADMIN`: ALL.
  - `PLAYER`: Select only, and ONLY for records where `campaign_id` matches a campaign they are a member of.

### Private Player Data (The "Private Log" Pattern)

Some data (e.g., secret backstories, private inventory, or personal notes) must be restricted to the specific player and the DM.

- **Implementation**: Add an `owner_id` (uuid) and a `visibility` enum (`PUBLIC`, `PRIVATE`, `SECRET`) to sensitive tables.
- **RLS Policy for Private Data**:
  ```sql
  -- Allow access if user is DM OR if user is the owner
  create policy "Private data access" on campaign_data
    for select
    using (
      (select role from profiles where id = auth.uid()) in ('DM', 'ADMIN')
      OR
      (owner_id = auth.uid())
    );
  ```
- **Visual Distinction**: Use a consistent UI badge (e.g., a "lock" icon or "DM + You" label) for private records to ensure players know what is shared vs. what is private.

### Role-Based UI Adaptation

Transitioning from `useRole` (localStorage) to a real `useAuth` hook:

- `ADMIN` sees User Management, Campaign Linking, and Global Settings.
- `DM` sees "Edit", "Manage", and hidden lore blocks.
- `PLAYER` sees "Read-only" views and player-facing summaries.

## Next Steps

1. Implement Supabase client setup in `src/utils/supabase`.
2. Create Auth triggers in Supabase to auto-create `public.profiles` on signup.
3. Replace `use-role.ts` logic with real session-based role fetching.
4. Implement Admin UI for managing DM/Player roles and Campaign associations.

### Campaign Linking Logic

To link a user to a specific campaign, we will use a `campaign_members` table:

```sql
create table public.campaign_members (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null, -- references campaign table
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('dm', 'player')) default 'player',
  created_at timestamp with time zone default now(),
  unique(campaign_id, user_id)
);
```

### Administrative Setup

The first administrative user must be manually promoted to `ADMIN` via the Supabase Dashboard or SQL editor. Since the `profiles` table does not store email directly (it's in `auth.users`), use a subquery:

```sql
update public.profiles
set role = 'ADMIN'
where id = (
  select id from auth.users where email = 'your-admin-email@example.com'
);
```
