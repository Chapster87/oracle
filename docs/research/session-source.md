# Research: Authoritative Server-Side Session Source

## Destination

A single, server-owned answer to "who is calling?" for Next.js Server Actions
and Server Components, so that `src/server/session.ts` stops being a
client-controlled prototype and `?role=` can be deleted. The session must be
read from the request's Supabase Auth cookies, verified, and resolved to a
`profiles.role` the server trusts — never from `searchParams`, `FormData`, or
`localStorage`.

## Recommendation

1. **The authoritative source is the Supabase Auth session stored in cookies,
   read on the server through `@supabase/ssr`'s `createServerClient`, and
   verified with `getClaims()`.** `cookies()` from `next/headers` supplies the
   cookie jar; `createServerClient` is the adapter that turns that jar into a
   Supabase session. `getClaims()` is the verification step, not the storage
   step.
2. **`@supabase/ssr` is required.** `@supabase/supabase-js` alone persists the
   session in `localStorage`, which the server cannot read. `@supabase/ssr`
   adds the cookie storage adapter (`getAll`/`setAll`), defaults the client to
   the PKCE flow, and is the only supported way to get a server-readable
   session. Install it alongside the existing `@supabase/supabase-js`.
3. **Read `profiles.role` from the database per request; do not put it in the
   JWT yet.** `getClaims()` gives you a verified `sub` (the user id) but no
   application role. Resolve the role with one indexed lookup on
   `public.profiles` using the service-role client. A custom-access-token hook
   that stamps `role` into the JWT is a later optimization, not the starting
   point.
4. **Replace `getSession(roleOverride)` with a server-only `getViewer()` that
   returns `{ userId, role }` from the verified session.** Delete the
   `roleOverride` parameter and every `searchParams.role` read. The function
   must throw (fail closed) when there is no verified session, rather than
   defaulting to DM.
5. **Keep the player RBAC path exercisable with two seeded accounts, not a
   query parameter.** The honest mechanism is a DM magic-link user and a
   player magic-link user; log in as each. If one-click switching is wanted,
   add a **dev-only impersonation cookie** set by a dev-only Server Action,
   gated on `NODE_ENV !== "production"` plus an explicit env flag, and resolved
   to a seeded non-owner profile id. Never accept the role from the URL.
6. **The mutation layer can ship before this lands, behind a stopgap that fails
   closed.** A `requireDmSession()` that throws until a verified session exists
   keeps the write surface inert without inventing a second identity source.
   Do not wire writes to the prototype `getSession`.
7. **Add `proxy.ts` (Next.js 16's renamed middleware) to refresh tokens, and
   still re-verify inside every Server Action.** Proxy coverage is not
   authorization: a matcher change can silently drop it, and Server Functions
   are POSTs to the page route, not separate routes.

## Why

### The pieces and how they fit together

There are four moving parts, and they do different jobs:

| Piece | Job | Source |
| --- | --- | --- |
| `cookies()` (`next/headers`) | Async access to the request cookie jar. Read in Server Components; read/write in Server Functions and Route Handlers. | [Next.js `cookies`](https://nextjs.org/docs/app/api-reference/functions/cookies) |
| `createServerClient` (`@supabase/ssr`) | Binds the cookie jar to a Supabase client via `getAll`/`setAll`, so the session survives server round-trips. | [Supabase — Creating a client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client) |
| `getClaims()` | Verifies the access token's signature and expiry, refreshing it when near expiry. Returns verified claims including `sub`. | [Supabase — Creating a client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client) |
| `proxy.ts` | Refreshes the token before render and writes the refreshed cookies to both the request and the response. | [Supabase — Creating a client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client) |

`cookies()` is asynchronous and must be awaited; it was synchronous in v14 and
earlier, and the sync path is deprecated
([Next.js `cookies`](https://nextjs.org/docs/app/api-reference/functions/cookies)).
Reading cookies in a layout or page opts the route into dynamic rendering, which
is the correct behavior for authenticated pages.

The Supabase SSR guide is explicit that the proxy exists because "Next.js Server
Components can't write cookies", so a proxy refreshes expired tokens and stores
them
([Supabase — Creating a client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client)).
It also states the failure mode: on Next.js 15 and earlier a `proxy.ts` file is
never called, so sessions never refresh and users get signed out; Next.js
renamed the file in version 16, and before that it was `middleware.ts` with an
`export async function middleware`
([Supabase — Creating a client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client)).

### Why `@supabase/ssr` and not `supabase-js` alone

The Supabase SSR guide states plainly that "Server-Side Rendering (SSR) with
Supabase requires cookie-based session storage. The `@supabase/ssr` package
handles this for JavaScript and TypeScript applications"
([Supabase — Creating a client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client)).
The advanced guide explains the mechanism: without SSR the tokens live in
`localStorage`, which "isn't accessible by the server, so for SSR, the tokens
instead need to be stored in a secure cookie"; `@supabase/ssr` clients "are
initiated to use the PKCE flow by default" and "are also automatically
configured to handle the saving and retrieval of session information in
cookies"
([Supabase — Advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide)).

So `@supabase/supabase-js` gives you an Auth client and a Data client, but its
default storage is browser-local. It has no cookie adapter and no server
session story. `@supabase/ssr` is the thin layer that supplies both. This repo
currently depends only on `@supabase/supabase-js` (`package.json`), which is
why there is no server-readable session today.

### Which verification call to use

Supabase's own guidance is a three-way split
([Supabase — Creating a client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client)):

- **`getClaims()`** — "use `getClaims` to verify identity (typically for
  protecting pages and data)". It reads the access token and verifies it,
  locally against a cached JWKS endpoint when the project uses asymmetric
  signing keys (the default for new projects), or by calling the Auth server
  when symmetric keys are in use. It also refreshes the session when the token
  is near expiry.
- **`getUser()`** — makes a network call and returns a fresh user record. Use
  it when you need the current record or need to detect a session revoked
  elsewhere.
- **`getSession()`** — "reads the session out of the cookie without
  revalidating it" and its user object "shouldn't be trusted on its own when
  storage is shared with the client". The guide says: "Anyone can forge the
  session cookie, so trusting it without verification lets an attacker render
  another user's page. Always use `supabase.auth.getClaims()` to protect pages
  and user data."

The advanced guide adds the one gap in `getClaims()`: it "verifies the token's
signature and expiry, which is what authorizes a request, but an unexpired
token stays valid even when the session behind it was revoked. Call `getUser()`
where that gap matters"
([Supabase — Advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide)).
For this app, `getClaims()` is the right default; `getUser()` is only needed if
you want immediate revocation on sensitive writes.

### Where `profiles.role` should be read

Three options, with the trade-offs that matter here:

| Option | How | Pros | Cons |
| --- | --- | --- | --- |
| **Per-request DB query** (recommended) | `getClaims()` → `sub` → `select role from profiles where id = sub` via `supabaseAdmin` | Always current; role changes take effect on the next request; one indexed PK lookup; no JWT size growth | One extra query per request (cacheable per request with React `cache`) |
| **Custom access token hook → JWT claim** | Postgres hook stamps `role` into the token before issue | No DB hit; usable directly in RLS via `auth.jwt()` | Stale until token refresh; adds JWT bytes (cookies are ~4 KB-limited); requires enabling an Auth Hook; role changes lag |
| **`app_metadata`** | Store role in `raw_app_meta_data` | Cannot be user-edited; appears in the JWT | Same staleness as a claim; still needs a write path to update it; duplicates `profiles.role` |

The decisive fact is that `user_metadata` must never hold authorization data:
Supabase's RLS guide says `raw_user_meta_data` "can be updated by the
authenticated user using the `supabase.auth.update()` function. It is not a
good place to store authorization data", while `raw_app_meta_data` "cannot be
updated by the user, so it's a good place to store authorization data"
([Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)).
The database advisor escalates the same point to an error: a policy that
references `user_metadata` is "a security policy relies on user-editable data",
because a user can call `updateUser({ data: { is_admin: true } })`
([Supabase — Advisor lint 0015](https://supabase.com/docs/guides/observability/advisors?queryGroups=lint&lint=0015_rls_references_user_metadata)).

Given the decision already made that `src/server/rbac.ts` is the TypeScript
gate and `supabaseAdmin` bypasses RLS, the role is needed in TypeScript, not in
SQL. A per-request query is simplest and always correct. The JWT-claim route
becomes attractive only when RLS is adopted as a second gate and you want
policies to read `auth.jwt() ->> 'role'` without a join; even then, the
custom-access-token hook is the documented mechanism
([Supabase — Custom Claims & RBAC](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac)).

One caveat if you ever do put the role in the JWT: the RLS guide warns that "a
JWT is not always 'fresh' ... even if you remove a user from a team and update
the `app_metadata` field, that will not be reflected using `auth.jwt()` until
the user's JWT is refreshed", and that cookie-based auth is bounded by the
~4096-byte cookie limit
([Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)).

### Removing `?role=` without losing the player path

The prototype override is a query parameter, and Next.js treats query
parameters as untrusted input: the Data Security guide shows `searchParams` as
a "BAD: Trusting searchParams directly" example and says to "re-verify every
time" from cookies
([Next.js — Data security](https://nextjs.org/docs/app/guides/data-security)).
The `use server` reference adds: "Read authentication from cookies or headers
rather than accepting tokens as function parameters"
([Next.js — `use server`](https://nextjs.org/docs/app/api-reference/directives/use-server)).

Two ways to keep the player RBAC branch testable:

1. **Two seeded accounts (preferred).** Seed a DM user and a player user, each
   with a `profiles.role`, and log in as each via magic link. This exercises the
   real code path end to end and needs no impersonation machinery. The player
   account's `id` is naturally distinct from the DM/owner id, which is exactly
   what the prototype's `PROTOTYPE_PLAYER_ID` was faking.
2. **Dev-only impersonation cookie (optional convenience).** A dev-only Server
   Action sets an `httpOnly` cookie naming a seeded profile; `getViewer()`
   honors it only when `process.env.NODE_ENV !== "production"` **and** an
   explicit flag such as `ALLOW_ROLE_IMPERSONATION === "true"` is set. The
   cookie value is validated against a hard-coded allowlist of seeded ids, never
   used as a free-form role. This keeps the override server-set and
   server-validated, unlike `?role=`.

Either way, the role must never come from the URL. The difference between the
prototype and the fix is not "no override" but "the override is server-owned
and cannot be forged by a link".

### Can the mutation layer ship first?

Yes, behind a stopgap, provided it fails closed. The write-side RBAC research
already reached this conclusion: "A Server Action added before that ticket must
not call the prototype `getSession`; the safe interim is a server-only
`requireDmSession()` that throws until a verified session exists, so the write
surface fails closed"
(`docs/research/write-side-rbac.md`). That stopgap is compatible with this
document: it is the same function, with the body swapped from "throw" to "read
verified claims + profile role" once `@supabase/ssr` lands. The important
constraint is that the interim check must not read `?role=` or `localStorage`,
or the write surface inherits the prototype's forgeability.

### Next.js 16 specifics

- **Server Actions are not separate routes.** "Server Functions are not
  separate routes in this chain. They are handled as POST requests to the route
  where they are used, so a Proxy matcher that excludes a path will also skip
  Server Function calls on that path." And: "Always verify authentication and
  authorization inside each Server Function rather than relying on Proxy alone"
  ([Next.js — `proxy.js`](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)).
- **Page-level checks do not extend to actions.** "A page-level authentication
  check does not extend to the Server Actions defined within it. Always
  re-verify inside the action"
  ([Next.js — Data security](https://nextjs.org/docs/app/guides/data-security)).
- **Actions are publicly reachable.** "By default, when a Server Action is
  created and exported, it is reachable via a direct POST request, not just
  through your application's UI"
  ([Next.js — Data security](https://nextjs.org/docs/app/guides/data-security)).
- **`cookies()` is async and read-only in Server Components.** Setting or
  deleting cookies is only allowed in a Server Function or Route Handler
  ([Next.js — `cookies`](https://nextjs.org/docs/app/api-reference/functions/cookies)).
- **Proxy is `proxy.ts` in Next.js 16, defaults to the Node.js runtime, and
  needs a negative matcher** so it does not run on static assets
  ([Next.js — `proxy.js`](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)).
- **Caching.** `cookies()` opts a route into dynamic rendering
  ([Next.js — `cookies`](https://nextjs.org/docs/app/api-reference/functions/cookies)).
  Supabase warns that ISR on an auth route can serve one user's `Set-Cookie` to
  another and recommends `export const dynamic = 'force-dynamic'` on pages that
  require authentication; as of `@supabase/ssr` v0.10.0 the library passes
  `Cache-Control`/`Expires`/`Pragma` to `setAll` on refresh
  ([Supabase — Advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide)).
- **Create the client per request.** Vercel's Fluid compute can reuse a warm
  instance, so "always initialize the Supabase client inside the request
  handler, not at module level"
  ([Supabase — Advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide)).
  This is a real hazard for this repo, whose `supabaseAdmin` is a module-scope
  singleton — fine for a stateless service-role client, wrong for a
  cookie-bound user client.

## What the repo actually contains

| Fact | Evidence |
| --- | --- |
| Session is a prototype stub with a client-controlled override | `src/server/session.ts` — `override === "PLAYER" ? "PLAYER" : "DM"`, hard-coded ids |
| `?role=` flows from `searchParams` into entity pages | `src/app/players/[id]/page.tsx` (and the sibling entity routes) pass `roleOverride={role}` |
| Directory pages call `getSession(roleOverride)` directly | `src/app/characters/page.tsx` and siblings |
| The role toggle is `localStorage`-backed | `src/app/layout.tsx` — `oracle_prototype_role` |
| `Role` has no `ADMIN` | `src/types/index.ts` — `export type Role = "DM" \| "PLAYER"` |
| Reads use a service-role client that bypasses RLS | `src/server/supabase.ts` — `SUPABASE_SERVICE_ROLE_KEY`, module-scope singleton |
| `@supabase/ssr` is not installed | `package.json` |
| `server-only` is not imported anywhere | grep `server-only` → only a comment in `src/server/supabase.ts` |
| No Server Actions exist | grep `"use server"` → 0 |
| No `rbac.ts` exists yet | `src/server/rbac.ts` absent |
| No `middleware.ts` or `proxy.ts` exists | both absent |
| `profiles` exists with `role in ('ADMIN','DM','PLAYER')`, auto-created by a signup trigger defaulting to `PLAYER` | `supabase/migrations/20260801135400_init_auth_schema.sql`, `20260801143000_update_constraints_case.sql` |
| `campaign_members` exists with `role in ('DM','PLAYER')` | `supabase/migrations/20260801141900_create_core_tables.sql` |
| RLS policies already read `profiles.role` via `auth.uid()` | same migration — `(select role from public.profiles where id = auth.uid()) = 'ADMIN'` |

## Facts that would change the decision

1. **If the app is deployed behind a CDN or uses ISR on authenticated routes**,
   the cookie-refresh response can leak a session. The fix is
   `dynamic = 'force-dynamic'` on auth routes and `Cache-Control: private,
   no-store`; if the deployment target cannot honor those, the proxy-refresh
   design needs rethinking
   ([Supabase — Advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide)).
2. **If immediate revocation matters** (a player is removed mid-session),
   `getClaims()` is insufficient and the write path must call `getUser()` or
   check the `session_id` claim against `auth.sessions`
   ([Supabase — Advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide),
   [Supabase — User Management](https://supabase.com/docs/guides/auth/managing-user-data)).
3. **If RLS becomes the second gate**, the role should move into the JWT via a
   custom-access-token hook so policies can read `auth.jwt() ->> 'role'`
   without a join — but accept the staleness and cookie-size costs
   ([Supabase — Custom Claims & RBAC](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac)).
4. **If `Role` gains `ADMIN`**, `getViewer()` must return it and `canWrite`
   must recognize it; otherwise admin writes silently fail (already flagged in
   `docs/research/write-side-rbac.md`).
5. **If the project still uses symmetric JWT signing keys**, `getClaims()`
   calls the Auth server on every verification instead of verifying locally,
   which changes the latency profile
   ([Supabase — Creating a client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client)).
6. **If Next.js is pinned below 16**, the refresh file is `middleware.ts` with
   `export async function middleware`, not `proxy.ts`
   ([Supabase — Creating a client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client)).

## Primary sources

- Next.js — `cookies`: https://nextjs.org/docs/app/api-reference/functions/cookies
  (async; read in Server Components, read/write in Server Functions and Route
  Handlers; opts route into dynamic rendering)
- Next.js — `proxy.js`: https://nextjs.org/docs/app/api-reference/file-conventions/proxy
  (`middleware` renamed to `proxy` in v16; Node.js runtime default; matcher;
  Server Functions are POSTs to the page route and are skipped by an excluding
  matcher)
- Next.js — Data security: https://nextjs.org/docs/app/guides/data-security
  (Data Access Layer; `server-only`; `searchParams` as untrusted input;
  page-level checks do not extend to Server Actions; actions reachable by direct
  POST)
- Next.js — `use server`: https://nextjs.org/docs/app/api-reference/directives/use-server
  ("Read authentication from cookies or headers rather than accepting tokens as
  function parameters")
- Supabase — Creating a client for SSR: https://supabase.com/docs/guides/auth/server-side/creating-a-client
  (`@supabase/ssr` required for cookie storage; `proxy.ts` vs `middleware.ts`;
  `getClaims` vs `getUser` vs `getSession`; "Never trust `getSession()` inside
  server code")
- Supabase — Advanced guide: https://supabase.com/docs/guides/auth/server-side/advanced-guide
  (PKCE default; cookie storage; ISR/CDN session leakage; per-request client
  initialization; `getClaims` vs `getUser` revocation gap)
- Supabase — Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
  (`raw_user_meta_data` user-editable vs `raw_app_meta_data` not; JWT freshness;
  cookie size limit)
- Supabase — Advisor lint 0015: https://supabase.com/docs/guides/observability/advisors?queryGroups=lint&lint=0015_rls_references_user_metadata
  (`user_metadata` is user-editable and unsafe for security policies)
- Supabase — Custom Claims & RBAC: https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac
  (custom-access-token hook; reading claims in RLS and in app code)
- Supabase — User Management: https://supabase.com/docs/guides/auth/managing-user-data
  (`profiles` table pattern; signup trigger; `session_id` revocation check)

## Open questions

- **Two seeded accounts or a dev impersonation cookie?** Two accounts is the
  honest path and needs no new code; the cookie is more convenient but adds a
  dev-only surface that must be provably inert in production. Which does the
  team prefer?
- **Should `getViewer()` be wrapped in React `cache()`?** It dedupes the
  profile lookup within a request, but the cookie-bound Supabase client must
  still be created per request. Confirm the caching boundary before writing it.
- **Does the app need `getUser()` anywhere?** If player removal must take
  effect immediately, the write path needs it; otherwise `getClaims()` alone is
  enough.
- **When does `Role` gain `ADMIN`?** The DB already has it; the TypeScript type
  does not. `getViewer()` cannot represent an admin until the type changes.
- **Is `supabaseAdmin` still needed for reads after this lands?** If reads move
  to a user-scoped client, RLS becomes the read gate and the TypeScript
  predicate changes role. That is a separate decision from this ticket.
