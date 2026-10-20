# Research: Write-Side RBAC for Campaign Entities

## Destination

A DM can create, edit, and delete campaign entities directly in the web app
behind write-side RBAC, with players read-only. This ticket answers **who may
write** and **where that rule is enforced**.

## Recommendation

1. **One canonical authorization module, `src/server/rbac.ts`, is the write
   gate.** It exposes `getViewer`, `canView`, `canWrite`, `canPromote`, and
   `allowedFields(type)`; the read helpers and the write DAL all call it.
2. **Write authority belongs to `ADMIN`, global `DM`, and campaign-scoped `DM`
   only.**
   - `profiles.role = 'ADMIN'`: any entity in any campaign, including global.
   - `profiles.role = 'DM'`: global entities (`campaign_id is null`) and
     campaigns where the viewer is a `campaign_members.role = 'DM'` member or
     the campaign owner.
   - Campaign-scoped DM (`campaign_members.role = 'DM'`, profile role
     `PLAYER`): that campaign only.
   - `PLAYER`: no writes. Ownership does **not** grant write.
3. **Enforce in TypeScript first.** `supabaseAdmin` is a service-role client
   (`src/server/supabase.ts`), so every query bypasses RLS. Until the app sends
   a user access token, RLS is documentation, not a control; the `server-only`
   DAL must call `canWrite` before every insert/update/delete.
4. **Make RLS the second gate only after reconciliation.** The target is a
   user-scoped `@supabase/ssr` client (publishable key + cookie session) or a
   secret-key client with the user token attached. Then RLS is enforcement, per
   Supabase's rule that a secret key bypasses only when no user token is carried.
5. **Ownership is read visibility, not a write grant.** `owner_id` is what lets
   a player see a private/secret row. Owner write would let a player set
   `visibility = 'public'` and rewrite DM-only fields. Player-authored content,
   if wanted, needs a narrow field allowlist.
6. **The server owns access-control columns.** On create, `owner_id` comes from
   the session (or a validated DM assignment), never raw input. `campaign_id`
   and `visibility` require authority over both source and destination scope.
   `secrets`, `rumors_lore`, and `metadata.dm_notes` are DM/ADMIN-only. `id`,
   `type`, and timestamps are immutable. Unknown fields are rejected.
7. **Two-phase writes use the same authority at both phases.** A draft may be
   proposed only by someone who could promote it; players cannot propose.
   Promotion re-authorizes against the current session, membership, and target
   row — not `drafts.created_by` or the role captured at propose time.
   `promote_draft(uuid)` stays `security invoker`, `for update`, with a
   `status = 'pending'` guard.
8. **A logical entity spans two tables.** The seed writes an `entities` row and
   a specialized row with the same id; promotion must write both in one
   transaction.
9. **Never source identity or role from the request payload.** The prototype
   `getSession` is client-controlled (`?role=PLAYER`; any non-`PLAYER` is DM)
   and `use-role` uses `localStorage`. Actions must verify the session from
   cookies/headers (`getClaims`/`getUser`) and load `profiles.role` server-side.
   This is blocked on ticket #36.
10. **RLS shape, once adopted:** one policy per operation, `TO authenticated`,
    `USING` for visible/target rows and explicit `WITH CHECK` for new rows, no
    `FOR ALL`, no `anon` grants.

## Why

### Who may write: roles and scope

The repo has three role vocabularies: `profiles.role` (`ADMIN`/`DM`/`PLAYER`),
`campaign_members.role` (`DM`/`PLAYER`), and the app's `Role` type
(`DM`/`PLAYER`). The app reads only the third, and `ADMIN` has no representation
in it. The identity resolver must return both the user id and profile role, and
authorization must treat `ADMIN` as a distinct authority.

| Actor                           | Global entity (`campaign_id is null`) | Campaign entity          | Rationale                                   |
| ------------------------------- | ------------------------------------- | ------------------------ | ------------------------------------------- |
| `ADMIN`                         | yes                                   | any campaign             | administrative escape hatch                 |
| Global `DM`                     | yes                                   | campaigns they DM or own | DM-authored world content plus their tables |
| Campaign `DM`                   | no                                    | that campaign only       | `campaign_members` is the scope             |
| `PLAYER`                        | no                                    | no                       | destination says players are read-only      |
| Owner (`owner_id = auth.uid()`) | no                                    | no                       | ownership is visibility, not authorship     |

Two decisions are deliberate. First, a global `DM` is **not** automatically a DM
of every campaign: `campaign_members` exists to scope campaign access, and the
current `role === "DM"` short-circuit is what makes campaign scoping
meaningless. `ADMIN` is the only cross-campaign role. Second, campaign ownership
counts as DM authority; otherwise a campaign could exist with nobody able to
administer it. No code reads `campaigns.owner_id` today, so that is a new rule.

### Where enforcement lives: TypeScript DAL vs RLS

`src/server/supabase.ts` creates `supabaseAdmin` with
`SUPABASE_SERVICE_ROLE_KEY`. Supabase is explicit: a secret key "authorizes
access through the `service_role` Postgres role, which has the `bypassrls`
attribute" and "Policies never apply to a secret key" (Row Level Security guide).
Every read and any write through that client is outside RLS.

The real gate is TypeScript, inlined three times: `getEntity`/`getEntities`
(`src/server/entities.ts`), `getStoryLog` (`src/server/story-log.ts`), and
`getLoreEntries` (`src/server/lore.ts`). The write DAL must call the same
predicate; a fourth copy will drift.

**Both layers are worth having, in the right order.** RLS becomes enforcement
when a request carries a validated user access token: "A secret key bypasses RLS
only when the request carries no user access token. If the request carries one,
it runs under the RLS policies of that signed-in user, even when the client
library was initialized with a secret key." The troubleshooting guide agrees:
"RLS is enforced based on the `Authorization` header and not the `apikey`
header."

Two ways to attach the token:

```ts
// Preferred: user-scoped SSR client (needs @supabase/ssr and a cookie session)
createServerClient(url, publishableKey, { cookies: { getAll, setAll } })

// Supported but fragile: secret-key client plus the user's JWT
createClient(url, process.env.SUPABASE_SECRET_KEY!, {
  accessToken: async () => sessionAccessToken,
})
```

The second is documented, but any helper that omits the `Authorization` header
silently reverts to bypass. Until a user-scoped client lands, write
**authorization is a TypeScript guarantee, not a database guarantee.**

### Reconciling the two RBAC definitions

The migrations and the TypeScript predicate disagree on almost every axis.
Adopting RLS without fixing this would change reads and writes in opposite
directions depending on the table.

| Dimension                                        | TypeScript today                      | RLS today                                                  | Canonical rule                      |
| ------------------------------------------------ | ------------------------------------- | ---------------------------------------------------------- | ----------------------------------- |
| `ADMIN`                                          | not recognized unless `role === "DM"` | full access (`FOR ALL`)                                    | `ADMIN` writes and reads everything |
| Campaign membership                              | ignored entirely                      | required for campaign rows on most tables                  | required for campaign-scoped access |
| Global private/secret                            | `owner_id` or DM                      | `campaign_id is null` → visible to all authenticated users | owner or DM only                    |
| Campaign private/secret on `players`/`items`/... | owner or DM                           | any campaign member (visibility ignored)                   | owner or DM only                    |
| Owner write                                      | none                                  | owner `FOR ALL` on `characters`/`locations`/`factions`     | none (players read-only)            |
| DM write                                         | none implemented                      | owner/DM `FOR ALL` on 3 tables; `entities` has no DM write | DM/ADMIN per the authority table    |
| Global DM read                                   | sees everything                       | globals visible to all; campaign rows only with membership | scoped (ADMIN crosses campaigns)    |

Three concrete bugs must be fixed before RLS can be trusted:

1. **`entities` leaks global private/secret rows.** "Global knowledge is
   viewable by all authenticated users" is just `campaign_id is null`, with no
   visibility or ownership test (`20260801141900_create_core_tables.sql`).
2. **The restored specialized-table SELECT policies ignore `visibility`.**
   `20260801200000_restore_rls.sql` grants members `campaign_id IS NULL OR
campaign_id IN (...)` for `players`, `items`, `religions`, `puzzles`,
   `quest_hooks`, `world_lore`, and `campaign_logs`, so any member sees
   private/secret rows.
3. **`campaign_members` has a self-referential SELECT policy.** "Members can
   view other members in their campaign" selects from `campaign_members` inside
   a policy on `campaign_members`. Postgres raises `42P17`, "infinite recursion
   detected in policy for relation", once RLS is enforced. Replace it with a
   `STABLE SECURITY DEFINER` helper in a private schema (for example
   `private.my_campaign_ids()`), `set search_path = ''`, execute granted only to
   `authenticated`.

The canonical predicate, expressed once:

```ts
export type Viewer = { userId: string; profileRole: "ADMIN" | "DM" | "PLAYER" }

export function canWrite(v: Viewer, e: EntityRef): boolean {
  if (v.profileRole === "ADMIN") return true
  if (e.campaignId === null) return v.profileRole === "DM"
  return isCampaignDm(v.userId, e.campaignId) // membership DM or campaign owner
}
```

Rewrite the policies from this predicate and add pgTAP allow/deny tests for
`select`, `insert`, `update`, and `delete` per table. If campaign membership
becomes canonical, players lose access to public entities in campaigns they are
not members of, and a global `DM` loses cross-campaign read unless `ADMIN`. That
is the intended domain model, but it differs from today's `role === "DM"`-sees-
everything behavior and belongs in the ticket that lands it.

### Owner semantics: does ownership alone grant write?

No. `owner_id` currently does two jobs, and only one is legitimate:

- **Read visibility.** A player may see a private/secret entity they own
  (`getEntity`: `visibility === "public" || owner_id === userId`). This is the
  deliberate "DM + You" treatment, and why the seed assigns `owner_id` to the
  admin.
- **Write authorship.** Nothing in the TypeScript predicate grants write, but
  the RLS policies on `characters`, `locations`, and `factions` do: "Owners and
  DMs can manage …" is `FOR ALL` keyed on `owner_id = auth.uid()`
  (`20260801153000_create_entity_tables.sql`).

Keep the first and drop the second. If players may write their own rows, a
player can set `visibility = 'public'`, write the secret fields the read path
strips, or reassign `owner_id`/`campaign_id` unless every field is separately
guarded. The trade-off is that a player cannot edit their own character sheet;
the DM edits it, or the map adds a narrow `player_notes` surface where the
player controls prose but not access-control columns.

### Field-level write rules

`stripSecrets` is the read-side filter: it deletes the per-type `secretField`
(`characters.secrets`, `locations.rumors_lore`, otherwise `metadata.dm_notes`)
before a player sees an entity (`src/server/entities.ts`, `src/utils/entity.ts`).
The write side needs a positive allowlist, because the current adapter passes
arbitrary `data` to `.insert()`/`.update()`
(`src/server/cms/adapters/supabase-record-manager.ts`).

| Field                                         | Who may set it                       | Rule                                                                                                |
| --------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `name`, `content`, type-specific prose        | DM/ADMIN                             | normal editing                                                                                      |
| `owner_id`                                    | server on create; DM/ADMIN on update | default to the actor; validate any assigned user is a real profile and, for campaign rows, a member |
| `campaign_id`                                 | ADMIN, global DM, campaign DM        | `null` means global; on update, authorize both source and destination                               |
| `visibility`                                  | DM/ADMIN only                        | access-control column; never accept from a player                                                   |
| `secrets`, `rumors_lore`, `metadata.dm_notes` | DM/ADMIN only                        | mirrors `stripSecrets`                                                                              |
| `id`, `type`, `created_at`, `updated_at`      | nobody                               | immutable/derived; `updated_at` is set by the trigger                                               |
| unknown fields                                | nobody                               | reject the payload; do not pass through                                                             |

`campaign_id` is two authorizations on update: the actor must be allowed in the
source campaign **and** the destination. A campaign DM who can only see campaign
A must not be able to push a row into B by changing the column; a `null`
destination requires `ADMIN` or a global `DM`. `owner_id` is also an
access-control column because it grants read visibility, so a campaign DM may
assign a private character to a player in their campaign (validated against
`campaign_members`), but a player must never set it.

### Two-phase writes: who drafts, who promotes

The mutation-layer research already chose drafts plus `promote_draft(uuid)`.
Write-side RBAC adds two rules:

1. **Propose authority equals promote authority at propose time.** A draft is
   not a permission bypass. `ADMIN`, global `DM`, and campaign-scoped `DM` may
   propose within their scope; `PLAYER` may not. Player submissions, if wanted,
   are a separate `origin = 'player'` moderation flow.
2. **Re-authorize at promote time.** Roles, membership, and the target row can
   change between propose and promote. The promoter's authority must be
   recomputed from the current session and the current row; `drafts.created_by`
   is audit data, not an authorization claim. For an `update` draft, load the
   current entity, check `canWrite` against its current `campaign_id` and
   `owner_id`, then check the payload's destination scope separately.

Keep `promote_draft` `security invoker`, re-check `status = 'pending'` under
`select ... for update`, and decide the client deliberately: through
`supabaseAdmin` the function runs as `service_role` and RLS does not apply, so
the TypeScript `canPromote` check is the only gate; through a user-scoped client
the function's DML is subject to the caller's policies, and `drafts` needs its
own policies. Do not mix the two and assume both are protected. Draft visibility
follows entity scope: `ADMIN` sees all; a global DM sees globals and campaigns
they DM; a campaign DM sees that campaign; players see none.

### Session and identity source

The prototype session cannot gate writes. `getSession(roleOverride)` treats any
value other than `"PLAYER"` as DM and hard-codes `PROTOTYPE_USER_ID`;
`searchParams.role` flows through `EntityDetailPage`; `use-role.ts` uses
`localStorage`. Next.js says to "read authentication from cookies or headers
rather than accepting tokens as function parameters" (`use server`), and a
page-level check "does not extend to the Server Actions defined within it"
(Data Security guide), which also lists `FormData`/`searchParams` as untrusted.

The real source is a Supabase Auth session read from cookies on the server.
`getClaims()` verifies the JWT signature and refreshes near expiry; `getUser()`
makes a network call and returns a fresh record; `getSession()` reads storage
without revalidation and its user object should not be trusted for authorization
when storage is shared with the client (Supabase, _Choosing an auth method_).
Use `getClaims()` or `getUser()` to establish identity, then load
`profiles.role` from the database. Do not put authorization data in
`user_metadata`; Supabase warns it is user-updatable, unlike `raw_app_meta_data`.

This is why write-side RBAC depends on sibling ticket #36. A Server Action added
before that ticket must not call the prototype `getSession`; the safe interim is
a server-only `requireDmSession()` that throws until a verified session exists,
so the write surface fails closed.

### RLS policy shape

When app writes move to a user-scoped client, write policies per operation.
PostgreSQL distinguishes `USING` (existing rows visible/targetable) from
`WITH CHECK` (resulting rows allowed), and Supabase's current guidance is a
separate policy for each operation rather than `FOR ALL`:

| Operation | `USING`                             | `WITH CHECK`                         |
| --------- | ----------------------------------- | ------------------------------------ |
| `SELECT`  | rows visible to the viewer          | n/a                                  |
| `INSERT`  | n/a                                 | the new row must satisfy the rule    |
| `UPDATE`  | which existing rows may be targeted | what the resulting row may look like |
| `DELETE`  | which existing rows may be deleted  | n/a                                  |

If `WITH CHECK` is omitted, PostgreSQL reuses `USING` as the check, but be
explicit: an `UPDATE` that reassigns `owner_id` or `campaign_id` needs a
destination check even when the source row is visible. Supabase also notes that
an `UPDATE` requires a matching `SELECT` policy.

Illustrative shape (repeat per entity table, or generate from helpers):

```sql
create policy "dm insert campaign characters"
on public.characters for insert to authenticated
with check (
  (select private.is_admin())
  or (campaign_id is null and (select private.is_global_dm()))
  or (select private.is_campaign_dm(campaign_id))
);

create policy "dm update campaign characters"
on public.characters for update to authenticated
using (<same predicate>)
with check (<same predicate>);
```

Other shape decisions:

- **Permissive vs restrictive.** Permissive policies are ORed; restrictive
  policies are ANDed and cannot grant. Use restrictive only for an invariant
  that must hold regardless of role.
- **Roles and grants.** Put `TO authenticated` on every policy and revoke
  `anon`. RLS runs after grants, and adding policies does not remove grants
  (Supabase, _Securing your API_). `campaign_logs` is currently granted to `anon`
  (`20260801190000_cleanup_and_permissions.sql`), and older projects grant all
  DML on `public` tables by default. If players are read-only, give
  `authenticated` `SELECT` only and keep writes in the DAL.
- **Performance.** Wrap `auth.uid()` in `(select auth.uid())`, and index
  `owner_id`, `campaign_id`, and `campaign_members.user_id`. The
  `campaign_members` primary key covers `campaign_id`, not `user_id`.
- **Helpers.** Define `is_admin()`, `is_global_dm()`, and
  `is_campaign_dm(uuid)` in a non-exposed `private` schema, `security definer`,
  `stable`, `set search_path = ''`, execute revoked from `public` and granted
  only to `authenticated`.
- **`force row level security`.** `service_role` has `BYPASSRLS`; `FORCE`
  subjects the table owner but not `BYPASSRLS` roles (PostgreSQL). Use it so a
  future `security definer` path does not skip policies, but it does not
  constrain `supabaseAdmin`.
- **`updated_at` triggers.** `handle_updated_at` is a `BEFORE UPDATE` trigger
  that sets `NEW.updated_at`; it reads no other tables and is invoker by
  default. Do not accept `updated_at` in the payload or pin it in `WITH CHECK`.

## What the repo actually contains

| Fact                                                                                       | Evidence                                                                                         |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Reads use a service-role client that bypasses RLS                                          | `src/server/supabase.ts` (`SUPABASE_SERVICE_ROLE_KEY`)                                           |
| The read gate is a TypeScript predicate                                                    | `src/server/entities.ts` — `role === "DM" \|\| visibility === "public" \|\| owner_id === userId` |
| The predicate is duplicated in the story log                                               | `src/server/story-log.ts` — same three-way test on `campaign_logs`                               |
| The predicate is duplicated again in lore, as SQL                                          | `src/server/lore.ts` — a `.or()` filter when `role !== "DM"`                                     |
| `stripSecrets` removes the per-type secret field and `metadata.dm_notes`                   | `src/server/entities.ts`; `src/utils/entity.ts` (`secrets`, `rumors_lore`, else `dm_notes`)      |
| `ADMIN` is not recognized by the app predicate                                             | `src/server/entities.ts`; `src/types/index.ts` defines `Role = "DM" \| "PLAYER"`                 |
| No code reads `profiles.role`                                                              | grep finds `profiles` only in migrations and the seed script                                     |
| Session is a prototype stub with a client-controlled override                              | `src/server/session.ts` — `override === "PLAYER" ? "PLAYER" : "DM"`, hard-coded ids              |
| `?role=` and `localStorage` are client-controlled role sources                             | entity pages and `EntityDetailPage` pass `searchParams.role`; `src/client/hooks/use-role.ts`     |
| No Server Actions or Route Handlers exist                                                  | grep `"use server"` → 0; `src/app/api/**` absent                                                 |
| The only write implementation is the CMS adapter                                           | `src/server/cms/adapters/supabase-record-manager.ts` — insert/update/delete, no transaction      |
| The only adapter caller is the MCP bridge                                                  | `src/server/mcp/oracle-db.ts` — tools take a bare `model` and arbitrary `data`                   |
| `entities` RLS is ADMIN `FOR ALL` plus SELECT policies; no DM write                        | `20260801141900_create_core_tables.sql`                                                          |
| `characters`/`locations`/`factions` do have an owner/DM `FOR ALL` write policy             | `20260801153000_create_entity_tables.sql`                                                        |
| Other specialized tables have only ADMIN `FOR ALL` for writes                              | `20260801170000_add_specialized_entities.sql`                                                    |
| Restored SELECT policies ignore `visibility` for campaign members                          | `20260801200000_restore_rls.sql`                                                                 |
| `campaign_members` has a self-referential SELECT policy                                    | `20260801141900_create_core_tables.sql` — subquery on its own table                              |
| `campaign_logs` is granted to `anon`                                                       | `20260801190000_cleanup_and_permissions.sql`                                                     |
| Global private/secret entities are visible to all authenticated users under RLS            | `20260801141900_create_core_tables.sql` — policy is only `campaign_id is null`                   |
| Roles are `ADMIN`/`DM`/`PLAYER` in profiles; `DM`/`PLAYER` in `campaign_members`           | `20260801135400_init_auth_schema.sql`; `20260801141900_create_core_tables.sql`                   |
| A logical entity is written to `entities` plus a specialized table with the same id        | `src/server/scripts/migrations/main.ts` — `base.id = entity.id`                                  |
| `players`/`items`/... reference `entities(id)`; `characters`/`locations`/`factions` do not | `20260801153000_create_entity_tables.sql`, `20260801170000_add_specialized_entities.sql`         |
| `@supabase/ssr` and `server-only` are not installed                                        | `package.json`                                                                                   |

## Facts that would change the decision, or that need new tickets

1. **Reconcile RLS with the canonical predicate.** The current policies leak
   global private/secret rows, ignore `visibility` for campaign members, recurse
   on `campaign_members`, grant owner writes on three tables, and have no DM
   write on `entities`. **Candidate ticket:** _Reconcile RLS policies with the
   TypeScript RBAC predicate._
2. **The session source is unresolved.** Write-side RBAC cannot read identity
   from `getSession`. Sibling ticket #36 covers it; until it lands, writes fail
   closed. **Candidate ticket:** already exists (#36).
3. **Draft approval authority is undefined.** The mutation-layer doc assumes a
   DM-only surface but does not define cross-DM visibility, campaign-owner
   approval, or player submissions. **Candidate ticket:** _Define draft
   visibility and approval authority per campaign._
4. **Field-level write rules are undefined.** `owner_id`, `campaign_id`,
   `visibility`, and the secret fields need an allowlist and validation path.
   **Candidate ticket:** _Field-level write policy and payload allowlists._
5. **The two-table entity topology is unowned.** A logical entity is an
   `entities` row plus a specialized row, written by two calls with no
   transaction. **Candidate ticket:** _Decide the canonical entity table and
   make promotion transactional._
6. **MCP writes bypass draft/approval.** `create_record`, `update_record`, and
   `delete_record` are live service-role writes with a model-shaped schema.
   **Candidate ticket:** _Route MCP writes through the DAL or make the bridge
   read-only._
7. **Relation writes have no campaign column.** `entity_relations` and
   `campaign_appearances` have only ADMIN write policies and no
   `campaign_id`/`owner_id`; authorization must derive from the endpoints.
   **Candidate ticket:** _Authorization for relation and appearance writes._
8. **RLS-as-enforcement needs infrastructure.** Install `@supabase/ssr`, add
   cookie/proxy plumbing, create a user-scoped server client, revoke `anon`
   grants, and add policy tests. **Candidate ticket:** _Adopt a user-scoped
   Supabase client for app writes._
9. **Promoted changes leave no audit trail.** `drafts` records
   `created_by`/`decided_by`, but the entity keeps no history. **Candidate
   ticket:** _Audit trail for promoted entity changes._
10. **Player-authored content is not entity write.** It needs a narrow field
    allowlist or a separate table. **Candidate ticket:** _Player-authored
    character fields (optional)._

## Primary sources

- Supabase — Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
  (grants vs policies; roles; `USING` vs `WITH CHECK`; per-operation policies; `bypassrls`; the secret-key/user-token rule; `security definer`/`search_path`; recursion)
- Supabase — API keys: https://supabase.com/docs/guides/api/api-keys
  (key-to-Postgres-role mapping; "Policies never apply to a secret key"; grants are evaluated before RLS)
- Supabase — Securing your API: https://supabase.com/docs/guides/api/securing-your-api
  (grants and RLS are separate controls; default privileges; revoke automatic grants)
- Supabase — Creating a client for SSR: https://supabase.com/docs/guides/auth/server-side/creating-a-client
  (`@supabase/ssr`; cookie server client; `getClaims` vs `getUser` vs `getSession`; "Never trust `getSession()` inside server code")
- Supabase — Service-role client and RLS: https://supabase.com/docs/guides/troubleshooting/why-is-my-service-role-key-client-getting-rls-errors-or-not-returning-data-7_1K9z
  (RLS follows the `Authorization` header, not the `apikey` header; SSR session can override the service key)
- Supabase — Administration with a secret key: https://supabase.com/docs/guides/troubleshooting/performing-administration-tasks-on-the-server-side-with-the-servicerole-secret-BYM4Fa
  (separate server client with `persistSession`/`autoRefreshToken` disabled)
- Supabase — `accessToken` option: https://supabase.com/docs/guides/auth/third-party/custom-oidc
  (passing an `accessToken` function to `createClient`; the JWT determines the Postgres role and RLS)
- PostgreSQL — Row Security Policies: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
  (`USING` vs `WITH CHECK`; implicit `WITH CHECK`; permissive OR vs restrictive AND; `FOR ALL`; owners and `BYPASSRLS`; recursion)
- Next.js — Data security: https://nextjs.org/docs/app/guides/data-security
  (Data Access Layer; `server-only`; validate `FormData`/`searchParams`; page checks do not extend to Server Actions)
- Next.js — `use server`: https://nextjs.org/docs/app/api-reference/directives/use-server
  ("Read authentication from cookies or headers rather than accepting tokens as function parameters")

## Open questions

- **Should a global `DM` write into any campaign, or only campaigns they DM or
  own?** The recommendation scopes them. If the product is single-DM and
  self-hosted, "global DM anywhere" is simpler and closer to the auth-flow
  research; if it is multi-tenant, scoping is required.
- **Is `entities` canonical or a legacy shadow table?** The read path never
  queries it, yet every seeded entity writes it. Until that is decided, a
  promotion must write both and accept the possibility of a partial write.
- **Does campaign ownership confer DM authority?** The recommendation says yes.
  No current code reads `campaigns.owner_id`, so this is a product decision.
- **May a player ever propose a draft?** The recommendation says no. A player
  submission queue is plausible but changes the approval and visibility rules.
- **With multiple DMs per campaign, who may see and promote whose drafts?**
  Campaign-scoped visibility is recommended, but "only the author may promote"
  is equally defensible.
- **Should `ADMIN` be an application role or operational-only?** Today `Role` is
  `DM | PLAYER`. Even if the UI never shows it, the server-side viewer type must
  represent `ADMIN`, or admin writes will silently fail `canWrite`.
