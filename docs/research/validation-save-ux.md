# Research: Validation and Save UX

## Destination

A DM editing a campaign entity gets a write path that rejects bad or unauthorized
input at every entry point (Server Action, DAL, and MCP), tells them which field
failed without losing what they typed, and detects a second DM's edit instead of
silently overwriting it. Players remain read-only.

This builds on two decisions already made:

- **Mutation layer** (`docs/research/mutation-layer.md`): Server Actions delegate
  to a `server-only` DAL in `src/server/cms/`; one write implementation with two
  entry points; drafts in `public.drafts` promoted by `public.promote_draft(uuid)`;
  `revalidatePath`, no tagged cache.
- **Write-side RBAC** (`docs/research/write-side-rbac.md`): `ADMIN` anywhere;
  global `DM` for globals and campaigns they DM/own; campaign DM for that
  campaign; players read-only; `src/server/rbac.ts` is the gate while
  `supabaseAdmin` bypasses RLS.

## Recommendation

1. **Adopt Zod 4 as a direct runtime dependency.** Define one strict schema per
   entity type under `src/schemas/`, validate at the Server Action boundary and
   again in the DAL, and reuse the same schemas for MCP tool arguments. Hand-rolled
   per-type validators are rejected. Valibot and ArkType are credible alternatives
   but do not justify a second schema system here.
2. **Use pending state, not optimistic state, for canonical writes.** Use
   `useActionState` for returned state and `useFormStatus` for a submit button,
   then let `revalidatePath` re-render the Server Component in the same roundtrip.
   Do **not** use `useOptimistic` for create, edit, or promote in v1. Reserve it
   for low-risk list actions (discarding a draft, tag chips) if measured latency
   warrants it.
3. **Use optimistic concurrency keyed on `updated_at`.** A direct update is
   `update ... where id = $1 and updated_at = $2 returning *`; zero rows means a
   conflict. Promotion locks the draft and target with `select ... for update`,
   compares the target's `updated_at` with `drafts.base_updated_at`, and raises a
   `PT409` error on mismatch. No new revision column in v1. Never silently
   overwrite; return a conflict result the DM can act on.
4. **Expected errors are return values; unexpected errors are thrown.** Return a
   typed `ActionResult` union from the action, render `fieldErrors` by input name,
   preserve uncontrolled input values, and let unexpected errors reach
   `app/error.tsx`. Never return raw database messages, submitted secret values,
   or secret field names to an unauthorized caller.
5. **#22 already answers who may set which fields.** Restated below. The genuinely
   remaining update-payload questions are: create vs update shape, partial
   (PATCH) semantics, draft patch vs snapshot, and how `campaign_id`'s source and
   destination are represented and re-authorized. This document defines those;
   metadata merge semantics remain with #23.

## Why

### 1. Validation library: Zod 4, server-only, one schema per type

The choice is not "library vs no validation"; it is "one declarative schema per
type vs six hand-written validator families, each with create/update variants and
field-error plumbing."

| Option               | Fit                                                                                                                                                                     | Verdict                                                                                                                          |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Zod 4**            | TypeScript-first, `z.infer`, `safeParse`, strict objects, structured issues, zero dependencies. Already installed as a required peer dependency of the MCP SDK.         | **Adopt**                                                                                                                        |
| Hand-rolled per type | Repeats ~6 types × ~10 fields × create/update, plus unknown-key rejection, coercion, nested `metadata`, and error paths. Guaranteed to drift from `src/types/index.ts`. | Reject                                                                                                                           |
| Valibot              | Modular and much smaller, competitive on client bundles.                                                                                                                | Reject for v1: server-first validation and no existing dependency. Revisit only if client bundle size becomes a real constraint. |
| ArkType              | TypeScript-native syntax and very fast.                                                                                                                                 | Reject: different mental model, smaller ecosystem, performance is not the bottleneck here.                                       |
| Yup / Joi            | Mature but weaker inference and no reason to add one alongside Zod.                                                                                                     | Reject                                                                                                                           |

**Why Zod 4 specifically.** Zod 4 is the stable current major (4.6 is the current
release in the docs at the time of writing). The repo already has `zod@4.4.3`
installed transitively through `@modelcontextprotocol/sdk@1.30.0`; the SDK has a
required peer dependency on Zod and imports `zod/v4` internally. Adding Zod as a
direct dependency therefore makes an existing runtime dependency explicit rather
than adding a new one. It also means the MCP entry point and the web entry point
can share the same schema objects.

**Dependency, not devDependency.** The schemas are imported by Server Actions, the
DAL, and the MCP bridge at runtime. `devDependencies` is for build-time-only
packages; using it here would break a production install that omits dev
dependencies. Add `"zod": "^4.4.3"` (or `"^4"`) to `dependencies` and let npm
dedupe against the SDK's copy.

**Server-only in v1.** The browser does not need to run the same schema. Client
forms can use native constraints (`required`, `type="url"`, `maxLength`) and
render the server's field errors. This avoids shipping the full schema — including
DM-only and access-control fields — in the client bundle, and it keeps
authorization semantics on the server. If client-side validation becomes
necessary for UX, derive a public subset with `schema.pick(...)` rather than
shipping the full write schema. The bundle cost is real but modest: the Zod docs
measure regular Zod at roughly 5.9–13.1 kB gzipped for small schemas (about 17 kB
for all of Zod), versus 2.1–4.0 kB for Zod Mini. That is not a reason to choose a
different library for a server-first app.

**Type inference from `src/types`.** Do not try to make one schema serve reads,
inserts, and updates. That is exactly the distinction Supabase draws in its
generated types: `Row` includes generated columns, `Insert` requires non-default
columns, and `Update` makes everything optional. Mirror that:

- `src/types/index.ts` stays the **read model** (`Character`, `Location`, …).
- `src/schemas/<type>.ts` defines `create` and `update` input schemas.
- `type CreateCharacterInput = z.infer<typeof characterCreateSchema>`.
- Add a compile-time compatibility check where the fields overlap, so the schema
  and the interface cannot drift silently.

**Naming and layout.** Top-level `src/schemas/` follows the repo's "shared modules
live at the top level of `src/`" convention. Suggested files:

```
src/schemas/
  common.ts          # uuid, visibility, tags, metadata helpers
  character.ts
  location.ts
  faction.ts
  player.ts
  item.ts
  religion.ts
  index.ts           # model -> schema registry
```

`src/server/cms/` imports these; the MCP bridge can import the same registry. If
the schemas later need to be provably server-only, add `import "server-only"` to
a wrapper module, not to the schema files themselves.

A compact per-type shape (character shown; the other types follow the same
pattern):

```ts
// src/schemas/character.ts
import * as z from "zod"
import { accessFields, tags } from "./common"

const characterContent = z.strictObject({
  name: z.string().trim().min(1).max(200),
  species: z.string().max(100).nullable().optional(),
  class: z.string().max(100).nullable().optional(),
  alignment: z.string().max(100).nullable().optional(),
  appearance: z.string().max(20_000).nullable().optional(),
  personality: z.string().max(20_000).nullable().optional(),
  role: z.string().max(100).nullable().optional(),
  is_deceased: z.boolean().optional(),
  tags: tags.optional(),
  metadata: z
    .strictObject({
      ddb_url: z.url().optional(),
      dm_notes: z.string().max(20_000).nullable().optional(),
    })
    .optional(),
})

const secretFields = {
  secrets: z.string().max(20_000).nullable().optional(),
}

export const characterCreateSchema = z.strictObject({
  ...characterContent.shape,
  ...secretFields,
  ...accessFields,
})

export const characterUpdateSchema = z
  .strictObject({
    ...characterContent.partial().shape,
    ...secretFields,
    ...accessFields,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No fields to update",
  })
```

`accessFields` is the shared shape `{ owner_id?, campaign_id?, visibility? }`.
It makes those fields _representable_ in a payload; it does not make them
_permitted_. Permission is a separate RBAC check, because only the server knows
the actor's campaign membership and the target row's current scope. The same is
true of `metadata.dm_notes`: it is a leaf path that `allowedFields` must treat as
DM/ADMIN-only.

**Unknown keys, immutables, and `$ACTION_`.** Use `z.strictObject` so unknown keys
produce an `unrecognized_keys` issue. `id`, `type` (the entity discriminator), and
timestamps are deliberately absent from the schema. One implementation gotcha:
Next.js documents that `Object.fromEntries(formData)` includes generated
`$ACTION_*` properties. A strict schema will reject every form submission unless
the action filters those keys first.

```ts
function formToObject(formData: FormData) {
  return Object.fromEntries(
    [...formData].filter(([key]) => !key.startsWith("$ACTION_"))
  )
}
```

**Reuse across entry points.** The action parses `FormData`; the DAL parses (or
re-validates) the object; the MCP tool parses its JSON arguments with the same
schema. The DAL must re-validate because it is a separate entry point reachable
from MCP and because TypeScript types disappear at runtime. Never assume "the
action already validated it" inside the DAL.

**The one prerequisite.** Zod 4's docs require `"strict": true` in
`tsconfig.json` for reliable inference. The repo currently has `"strict": false`.
Running `npx tsc --noEmit --strict` today produces exactly **one** error
(`campaign` possibly `null` at `src/server/scripts/migrations/main.ts:125`), so
enabling strict is cheap and should be part of the implementation ticket.

### 2. Save UX: pending state, not optimistic state

Next.js Server Actions have a property that changes the calculus: when an action
calls `revalidatePath`, Next.js re-renders the current route server-side and ships
the new RSC payload **in the same response** as the action's return value. The
canonical UI therefore updates in one roundtrip; there is no separate refresh to
hide behind an optimistic value. Server Actions are also dispatched one at a time
per client, so optimistic UI would imply concurrency the client does not actually
have.

React 19 provides the pieces:

- `useActionState(reducerAction, initialState)` returns
  `[state, dispatchAction, isPending]`. The action receives the previous state and
  the submitted `FormData`, which is the shape needed to return field errors.
- `useFormStatus()` returns `{ pending, data, method, action }` and must be called
  from a component rendered **inside** the `<form>`. That is the right tool for a
  reusable `<SubmitButton>`.
- A Server Action passed to `<form action>` works before hydration; React
  documents that a Client Component form using a Server Action and
  `useActionState` can display a submission error without JavaScript.

`useOptimistic` is temporary by design: it renders only while an Action is in
progress, and on failure React re-renders with the unchanged base value. That is
safe, but for an entity save it produces a visible flash of a value the server
rejected. It also cannot help a no-JS submission, because there is no Transition.

| Flow                                         | Recommended feedback                                                                                           | Why                                                                                                                        |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Create / edit dialog**                     | `useActionState` + `useFormStatus`; disable submit; show "Saving…"; close only after `state.ok`                | The server may reject for validation, RBAC, or conflict; closing optimistically would hide the error or reopen the dialog. |
| **Propose draft**                            | Pending on the submit button; on success, `revalidatePath("/drafts")` and render the new draft from the server | A draft is not live content; showing it as live is wrong.                                                                  |
| **Promote draft**                            | Pending on that row; return value drives the row's state; server re-render shows the promoted entity           | Promotion can conflict. An optimistic "promoted" badge would lie.                                                          |
| **Discard draft**                            | Optional `useOptimistic` removal, restored on failure                                                          | Low-stakes, reversible, list-local. This is the one place optimistic UI is clearly worth it.                               |
| **Inline metadata sub-field** (e.g. DDB URL) | Pending state on the field/button; server re-render                                                            | Small payload, but still access-controlled and conflict-checked. Add optimistic only if latency is measured to hurt.       |

**Draft → promote.** The propose and promote steps are deliberately separate
commits. Optimistic UI would blur that: a draft that appears promoted before the
server confirms it defeats the human approval step. Keep both steps
pending-driven.

### 3. Conflict handling: `updated_at` as the concurrency token

Two DMs can edit the same row, and the draft flow makes the window larger: a draft
can sit for hours between propose and promote. The current adapter
(`src/server/cms/adapters/supabase-record-manager.ts`) does
`.update(data).eq("id", id)`, which is last-write-wins; the second writer silently
discards the first.

| Option                                     | Mechanism                                                                        | Verdict                                                                                                                            |
| ------------------------------------------ | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Last-write-wins**                        | `.update(data).eq("id", id)`                                                     | **Reject** for entity edits. It is the bug this ticket exists to prevent, and the draft review window makes it likely.             |
| **Optimistic concurrency on `updated_at`** | `update ... where id = $1 and updated_at = $2 returning *`; zero rows = conflict | **Recommended v1.** No schema change; every entity table already has `updated_at` and a `handle_updated_at()` trigger.             |
| New `revision` / `version` column          | Trigger increments an integer; compare it                                        | More robust and exact, but adds a column and trigger change to ~11 tables. Keep as a fallback if `updated_at` proves insufficient. |
| `select ... for update` in promote         | Lock the draft and target rows, compare, then write in one transaction           | **Required** for `promote_draft`, where the compare and write must be atomic.                                                      |
| Deep-compare a base snapshot               | Store the full base row and three-way merge                                      | Defer. It needs `base_snapshot`, a merge policy, and a diff UI. It is not required to prevent lost updates.                        |

**Why `updated_at` is workable.** Every entity table created by the migrations has
`updated_at timestamptz default now()` and a `before update` trigger that sets
`NEW.updated_at = now()`. Under PostgreSQL's default Read Committed isolation, an
`UPDATE` re-evaluates its `WHERE` clause against the newly committed version of a
row it was waiting on. So if two transactions race, the second one's
`updated_at = $2` predicate fails against the first one's new timestamp and it
updates zero rows. That is exactly the conflict signal, without an explicit lock.

Two implementation details matter:

- **Keep `updated_at` as the raw string.** Supabase returns a `timestamptz` string
  with microsecond precision. Do not round-trip it through a JavaScript `Date`,
  which truncates to milliseconds and would produce false conflicts. Pass the
  string straight back into `.eq("updated_at", value)`.
- **Use `is distinct from` in SQL.** In `promote_draft`, compare
  `current.updated_at is distinct from d.base_updated_at` so a null token is a
  conflict rather than an accidental match.

**Direct update shape.** The DAL should take an explicit `expectedUpdatedAt`
argument. The form carries it as a hidden field (or as a bound argument), so the
value is never derived from a fresh read at submit time.

```ts
const { data, error } = await supabaseAdmin
  .from(table)
  .update(patch)
  .eq("id", id)
  .eq("updated_at", expectedUpdatedAt)
  .select("*")
  .maybeSingle()

if (error) throw error
if (!data) return { ok: false, code: "conflict" as const }
return { ok: true, entity: data }
```

PostgREST compiles this to a single `UPDATE ... WHERE id = ... AND updated_at =
... RETURNING *`. `.maybeSingle()` returns no row (or the caller can check the
`select()` array length) when zero rows matched, which is the conflict branch.

**Promote shape.** `promote_draft(uuid)` must lock the draft for idempotency and
the target for the base comparison, then write in the same transaction:

```sql
create or replace function public.promote_draft(p_draft_id uuid)
returns uuid
language plpgsql
security invoker
as $$
declare
  d public.drafts;
  current_updated_at timestamptz;
  new_id uuid;
begin
  select * into d from public.drafts
    where id = p_draft_id
    for update;

  if not found then
    raise exception 'draft_not_found' using errcode = 'PT404';
  end if;
  if d.status <> 'pending' then
    raise exception 'draft_not_pending' using errcode = 'PT409';
  end if;

  if d.kind in ('update', 'delete') then
    select updated_at into current_updated_at
      from public.characters              -- per-model branch, never dynamic SQL
      where id = d.target_id
      for update;

    if not found then
      raise exception 'target_not_found' using errcode = 'PT404';
    end if;
    if current_updated_at is distinct from d.base_updated_at then
      raise exception 'stale_draft' using errcode = 'PT409';
    end if;
  end if;

  -- apply the validated patch, then mark the draft promoted
  ...
  return new_id;
end;
$$;
```

`PT409` is PostgREST's convention for a custom `409 Conflict`; PostgREST forwards
the SQLSTATE as the error `code` and maps `PTxyz` to HTTP `xyz`. The DAL maps
`PT409` to `{ ok: false, code: "conflict" }`. Do not use `40001`
(serialization failure) for this: PostgREST maps `40*` to HTTP 500.

**Lock ordering.** Lock the `drafts` row first, then the target row. Two promotes
of the same draft serialize on the draft; two promotes of different drafts
targeting the same entity serialize on the target, and the loser sees the new
`updated_at` and conflicts. Do not lock targets in different orders across
models; a consistent draft-then-target order avoids deadlocks.

**What the DM sees.** Nothing is silently overwritten. The promote action returns
a conflict result, and the UI says:

> This draft was based on an older version of _NPC name_. Nothing was promoted.
> Review the current version and re-apply your changes.

The direct-edit form shows an inline form error on the same lines: "Someone else
changed this entity while you were editing. Your changes were not saved." Keep
the DM's typed values in the form, and offer a reload or re-apply action. Do not
auto-retry, and do not show a raw Postgres error or the current row's secret
fields.

**Caveats.**

- `handle_updated_at()` uses `now()`, which is the transaction start time. Two
  transactions that start in the same microsecond could theoretically produce the
  same token; a `revision bigint` removes that ambiguity.
- Every update bumps `updated_at`, including a no-op update. That is conservative
  and acceptable: it turns a no-op into a conflict rather than a silent write.
- The logical entity spans `entities` plus a specialized table
  (`src/server/scripts/migrations/main.ts`). The concurrency token must be
  whichever row the form binds to — normally the specialized row — and promotion
  must write both rows in one transaction. If #40 decides `entities` is canonical,
  move the token or guard both rows consistently.
- Any future table without the `handle_updated_at` trigger breaks the mechanism.
  Add a migration test that asserts every writable entity table has the trigger.

### 4. Server-side error surfacing

Model the action's result explicitly. Do not throw for expected failures.

```ts
type ActionErrorCode =
  "validation" | "conflict" | "forbidden" | "not_found" | "constraint"

type ActionResult<T = void> =
  | { ok: true; data: T }
  | {
      ok: false
      code: ActionErrorCode
      /** Keyed by the input's `name` attribute, e.g. "name" or "metadata.ddb_url". */
      fieldErrors?: Record<string, string[]>
      /** Form-level message, safe to render. */
      formError?: string
    }
```

**Expected vs unexpected.** Next.js draws the line explicitly: expected errors
(validation, failed requests) should be returned as values; uncaught exceptions
should be thrown and caught by an error boundary. React's `useActionState` docs
say the same: known errors belong in state, unknown errors should be thrown.
Concretely:

- Zod failure → `{ ok: false, code: "validation", fieldErrors, formError }`.
- RBAC failure → `{ ok: false, code: "forbidden", formError }` (no field list for
  an unauthorized caller).
- `updated_at` mismatch → `{ ok: false, code: "conflict", formError }`.
- Unique violation (`23505`) → map to a field error on `name` when the constraint
  is `entities_name_campaign_id_key` or `entities_name_global_unique_idx`.
- Connection failure, invariant violation, unknown model, or a bug → `throw`.
  `app/error.tsx` renders the fallback. Next.js hides server error messages in
  production and exposes only a `digest`, so sensitive database text is not
  leaked by an unexpected error.

The action is a thin wrapper; the DAL performs the authoritative validation and
authorization and returns the same `ActionResult`. MCP tools can translate
`{ ok: false }` into a tool error at their boundary. Do not throw a validation
error from the DAL and catch it in the action just to convert it back into state.

**A concrete action shape.**

```ts
"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { characterUpdateSchema } from "@/schemas/character"
import { updateCharacter } from "@/server/cms/entities"

export async function updateCharacterAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  const parsed = characterUpdateSchema.safeParse(formToObject(formData))

  if (!parsed.success) {
    const { fieldErrors, formErrors } = z.flattenError(parsed.error)
    return {
      ok: false,
      code: "validation",
      fieldErrors,
      formError: formErrors[0],
    }
  }

  const result = await updateCharacter(parsed.data) // re-validates + re-authorizes
  if (!result.ok) return result

  revalidatePath(`/characters/${result.data.id}`)
  revalidatePath("/characters")
  return result
}
```

`z.flattenError` is the Zod 4 replacement for the deprecated `error.flatten()`.
It returns top-level `formErrors` and one level of `fieldErrors`. For nested
fields such as `metadata.ddb_url`, iterate `error.issues` and join
`issue.path.join(".")` instead, so the key matches the input's `name`.

**Mapping errors to inputs.** Use the schema key as the input `name` (dotted for
nested fields), render the first message next to the field, and wire up
accessibility:

```tsx
;<input
  name="name"
  defaultValue={entity.name}
  aria-invalid={Boolean(errors.name)}
  aria-describedby={errors.name ? "name-error" : undefined}
/>
{
  errors.name?.[0] && <p id="name-error">{errors.name[0]}</p>
}
```

**Preserving entered values.** Prefer uncontrolled inputs with `defaultValue`
from the entity. React resets uncontrolled fields after a **successful** action,
not after an error return, so a validation failure leaves the DM's text in place.
If a field must be controlled, return the submitted values in the error state or
keep them in local state; do not rely on the server to re-supply them.

**Pending state.** Put `useFormStatus` in a small `SubmitButton` rendered inside
the form:

```tsx
"use client"
import { useFormStatus } from "react-dom"

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}>
      {pending ? "Saving…" : children}
    </button>
  )
}
```

`useActionState` also exposes `isPending`, which is fine for a single form. Use
`useFormStatus` when the button is shared across forms. The two are equivalent for
one form; do not wire both into the same button.

**Progressive enhancement / no JS.** Use a real `<form action={formAction}>` and
a Server Action. React documents that a Client Component form using a Server
Action and `useActionState` can display the returned error even before the
JavaScript bundle loads. `useOptimistic` and `useFormStatus` add no no-JS
behaviour, which is another reason not to depend on them for correctness.

**Do not leak secrets.** `stripSecrets` is a read-side presentation filter; the
write side must not mirror it by silently deleting fields. Silent deletion would
let an unauthorized caller believe a secret saved, and would hide the
authorization failure. Instead:

- Reject unauthorized **known** fields with a generic `forbidden` result. Do not
  list `secrets`, `rumors_lore`, or `metadata.dm_notes` in the response.
- For an authorized DM, field-level messages may name the field; they must never
  echo the submitted value.
- Return only `{ code, fieldErrors, formError }`, never the raw row or the raw
  Supabase error. Server Action return values are serialized to the client, and
  Next.js advises returning only what the UI needs.
- Log `error.code` and `error.details` server-side; redact payload values. A
  validation message should be static, not interpolated with the value.
- For unknown keys, Zod's `unrecognized_keys` names the key. That is acceptable;
  the sensitive case is a **known** DM-only field submitted by an unauthorized
  caller, which must fail generically.

### 5. Update payload rules

**What #22 already answers.** The authorization half of the ticket's added
question is settled; do not re-open it.

| Field                                         | Who may set it                       | Rule                                                                                                          |
| --------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `name`, `content`, type-specific prose        | DM/ADMIN                             | Normal editing.                                                                                               |
| `owner_id`                                    | Server on create; DM/ADMIN on update | Default to the actor; validate any assigned user is a real profile and, for campaign rows, a campaign member. |
| `campaign_id`                                 | ADMIN, global DM, campaign DM        | `null` means global; on update, authorize both source and destination.                                        |
| `visibility`                                  | DM/ADMIN                             | Access-control column; never accepted from a player.                                                          |
| `secrets`, `rumors_lore`, `metadata.dm_notes` | DM/ADMIN                             | The same field set `stripSecrets` hides on the read side.                                                     |
| `id`, `type`, `created_at`, `updated_at`      | Nobody                               | Immutable or derived; `updated_at` is set by the trigger.                                                     |
| Unknown fields                                | Nobody                               | Reject the payload; do not pass it through.                                                                   |

**May a player update a `secret`/`private` entity? No.** Players are read-only in
the decided model. Ownership grants read visibility (`getEntity` returns a
private/secret row to its owner), not write authority. A player who owns a secret
character still cannot update it, and cannot set `visibility` or any other field.
Player-authored content, if it is ever wanted, needs a separate narrow allowlist
or table — not a relaxation of this rule.

**Which fields may a promote set?** Exactly the columns in the draft's validated
patch, subject to the same table above, re-checked against the **current** row and
the **current** session at promote time. Promotion is not a permission bypass.
`id`, `type`, and timestamps are never written from the payload; `owner_id`,
`campaign_id`, `visibility`, and the secret fields are written only when present
and authorized. Because `promote_draft` is callable via `rpc`, add a SQL-side
allowlist check as defense in depth: reject any payload key outside the per-model
column allowlist, even though the DAL already validated it.

**Create vs update.** Mirror Supabase's `Insert` vs `Update` distinction:

|                       | Create                                                            | Update                                                                  |
| --------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Discriminator         | `model` argument to the DAL/tool, not a payload field             | `model` + `target_id` arguments, not payload fields                     |
| Required fields       | `name` (every entity table has `name text not null`)              | None; at least one field must be present                                |
| `id`                  | Absent; the DB generates it                                       | Absent; `target_id` carries it                                          |
| Type-specific fields  | Optional unless the product requires them                         | Optional                                                                |
| Access-control fields | Optional, but server-authorized; `owner_id` defaults to the actor | Optional, but server-authorized; a `campaign_id` change is a scope move |
| Timestamps            | Absent                                                            | Absent                                                                  |
| Unknown keys          | Rejected                                                          | Rejected                                                                |

Do not accept `type` in the payload and do not derive the table from it. The
route/tool already chose the model; an allowlisted model registry maps it to the
table and schema. This also prevents a caller from turning a character payload
into a location write by changing a string.

**Partial (PATCH) semantics.** An update payload contains only the fields the DM
changed. Absent means "leave unchanged"; `null` means "set NULL"; `[]` means
"clear the array". This matters for the draft flow: the draft stores a reviewable
patch, not a full row that could clobber fields the form did not render. It also
means the form must distinguish "absent" from "empty", which is a form-layer
concern:

- Unchecked checkbox → field absent (or explicit `false`; pick one and be
  consistent).
- Empty text input → decide whether it means `null` or `""`; do this in the form
  mapper, not in the schema. (Open question below.)
- Multi-select → `formData.getAll(name)`; `Object.fromEntries` collapses repeated
  keys.
- Do not use `z.coerce.boolean()`: it turns the string `"false"` into `true`.
  Map checkboxes explicitly.

**Immutable fields.** Keep them out of the schema. If a caller sends `id`,
`type`, `created_at`, or `updated_at`, `z.strictObject` rejects the payload as
unknown. The action can special-case those key names to return a clearer
"immutable field" message, but do not silently drop them.

**The draft records a patch and a base.** Extend `public.drafts` from the
mutation-layer doc with:

```sql
alter table public.drafts
  add column base_updated_at timestamptz,
  add column base_snapshot  jsonb;        -- optional; see open questions

alter table public.drafts
  add constraint drafts_update_has_base
  check (kind = 'create' or base_updated_at is not null);
```

- `kind = 'create'`: `payload` is the validated insert payload; no base.
- `kind = 'update'`: `payload` is the partial patch; `target_id` is the row;
  `base_updated_at` is the target's `updated_at` when the draft was created.
- `kind = 'delete'`: `payload` is `{}`; `base_updated_at` is still required.
- If the DM edits the draft again, keep the **original** base. Re-basing without
  reloading the target would defeat conflict detection. If the UI reloads the
  entity, create a new draft or explicitly rebase with the new token.

`promote_draft` loads the target `for update`, compares
`target.updated_at is distinct from d.base_updated_at`, and only then applies the
patch. The DAL loads the current target before calling the function to re-check
`canWrite` against the **current** `campaign_id`/`owner_id`; the draft's
`base_snapshot` is review material, never an authorization claim.

**`campaign_id`: source and destination in the schema.** The payload schema only
types the destination:

```ts
campaign_id: z.uuid().nullable().optional()
```

- Absent → no scope change; authorize against the current row's `campaign_id`.
- Present and equal to the current value → no scope change; still authorize.
- Present and different → authorize **both** the current row's campaign (source)
  and the payload's campaign (destination). A `null` destination requires `ADMIN`
  or a global `DM`.
- The source is never a payload field. It comes from the target row loaded by the
  DAL at propose and re-loaded at promote. Accepting a client-supplied source
  would let a campaign DM claim authority over a row they cannot see.

This is a TypeScript authorization rule, not a Zod refinement: Zod can check that
`campaign_id` is a UUID or `null`, but only `src/server/rbac.ts` knows campaign
membership and campaign ownership. Implement it as
`assertScopeChange(viewer, sourceCampaignId, destinationCampaignId)` and call it
from both phases. The same function should validate `owner_id` assignments
(profile exists; campaign member when the row is campaign-scoped).

**Metadata.** `metadata` is a JSON object, and the read path already treats
`metadata.dm_notes` as a DM-only field. Two rules:

1. Typed per type, not `Record<string, unknown>`: known keys get real validators
   (e.g. `ddb_url: z.url()`), unknown metadata keys are rejected.
2. A patch to `metadata` should merge shallowly, not replace the whole object, so
   editing `ddb_url` does not wipe `dm_notes`. Clearing a key needs an explicit
   `null` convention. This overlaps with #23 (Metadata Sub-Field Editing), which
   owns the final key list and merge semantics.

The RBAC check must operate on **leaf paths**, so `metadata.dm_notes` is treated
as a secret field even though `metadata` itself is a normal field. A top-level
key check is not sufficient.

## What the repo actually contains

| Fact                                                      | Evidence                                                                                         |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| No validation library is imported by app code             | grep for `from "zod"`/`valibot`/`arktype`/`yup`/`joi` in `src/**` → no matches                   |
| Zod 4.4.3 is already installed transitively               | `npm ls zod` → `@modelcontextprotocol/sdk@1.30.0` → `zod@4.4.3` (deduped)                        |
| The MCP SDK requires Zod and imports `zod/v4`             | SDK v1 README: "required peer dependency on `zod` … internally imports from `zod/v4`"            |
| `strict` is off                                           | `tsconfig.json` → `"strict": false`                                                              |
| Enabling strict is nearly free                            | `npx tsc --noEmit --strict` → 1 error (`src/server/scripts/migrations/main.ts:125`)              |
| No Server Actions exist                                   | grep `"use server"` → 0 matches                                                                  |
| No form state hooks are used                              | grep `useActionState`/`useFormStatus`/`useOptimistic`/`useTransition` in `src/**` → 0 matches    |
| The only `<form>` is a static demo                        | `src/app/components/dialog/page.tsx` — no `action`, no `name` attributes                         |
| The write adapter does no validation                      | `src/server/cms/adapters/supabase-record-manager.ts` passes `any` to `.insert()`/`.update()`     |
| Updates are last-write-wins                               | `.update(data).eq("id", id)` — no `updated_at` guard                                             |
| Every entity table has `updated_at` + a trigger           | `20260801153000_create_entity_tables.sql`, `20260801170000_add_specialized_entities.sql`         |
| There is no revision/version column                       | grep `version`/`revision` in migrations → none on entity tables                                  |
| `visibility` is constrained                               | `check (visibility in ('public', 'private', 'secret'))` on every entity table                    |
| `name` is required                                        | `name text not null` on every entity table                                                       |
| Name uniqueness is only on `entities`                     | `20260801160000_add_unique_constraints.sql` — `(name, campaign_id)` plus a global partial index  |
| A logical entity spans two tables                         | `src/server/scripts/migrations/main.ts` writes `entities` + the specialized row with the same id |
| No test runner                                            | `package.json` `"test": "echo \"Error: no test specified\" && exit 1"`                           |
| Node 24.21.0 / npm 11.19.0                                | local toolchain                                                                                  |
| Next 16.2.12, React 19.2.8, TS 6.0.3, Supabase JS 2.111.0 | `package.json`                                                                                   |
| The read path filters secrets but the write path does not | `src/server/entities.ts` `stripSecrets`; no equivalent in `src/server/cms/`                      |

## Facts that would change the decision, or that need new tickets

1. **Enabling `strict` is a prerequisite, not a research question.** Only one
   error exists today, so fold the fix and `"strict": true` into the validation
   implementation ticket. If the team refuses, Zod inference will be weaker and
   the schema/interface compatibility check loses value.
2. **There is no test runner.** Schema and conflict tests need one. `node --test`
   on Node 24 plus the existing `tsx` dependency can run TypeScript tests without
   a new package, but `package.json` needs a real `test` script. **Candidate
   ticket:** wire a test runner (also needed for the RBAC pgTAP work).
3. **`public.drafts` does not exist yet.** `base_updated_at` (and optional
   `base_snapshot`) must be added in the same migration that creates the table.
   If #20 changes the drafts shape, adjust before implementation.
4. **Two-table topology is unresolved (#40).** The concurrency token belongs to
   the row the form edits (normally the specialized table), but promotion writes
   `entities` too. If `entities` becomes canonical, move the token or guard both
   rows. A mismatch here would let one table drift while the guard still passes.
5. **Metadata merge policy belongs to #23.** This document recommends a shallow
   merge and a strict per-type key list; the final key list and "how to delete a
   key" decision are #23's.
6. **Draft approval UI location (#30) decides whether `base_snapshot` is needed.**
   A conflict message only needs `base_updated_at`. A visual diff needs the base
   row. Do not store the snapshot until the UI needs it.
7. **Session source (#36) blocks authorization testing.** Validation and conflict
   handling can land first, but `forbidden` results cannot be exercised against a
   real session until #36 replaces `getSession`.
8. **`zod` is currently an undeclared transitive dependency.** Add it to
   `dependencies` explicitly. Relying on npm hoisting is fragile and would break
   if the MCP SDK changes its dependency layout.
9. **`updated_at` is not a perfect revision token.** If conflicts prove flaky
   (microsecond collisions, a table missing the trigger, or a bulk write path),
   add `revision bigint not null default 1` and an incrementing trigger. That is
   a migration across all entity tables and out of scope for v1.
10. **`23505` may point at `entities`, not the specialized table.** Name
    uniqueness lives on `entities`. Map the constraint names explicitly so the
    form highlights `name` rather than showing a generic error.
11. **Sharing schemas with the client has a bundle cost.** Server-only is the v1
    recommendation; if client-side validation is added, ship a `pick()`ed public
    subset, not the full schema with DM-only fields.
12. **There is no `server-only` package.** The mutation-layer doc already notes
    this. If schema modules must be provably server-only, that package is a new
    dependency.

## Primary sources

**Validation**

- Zod — introduction, features, install, `strict` requirement:
  https://zod.dev/
- Zod — error formatting (`z.treeifyError`, `z.flattenError`):
  https://zod.dev/error-formatting
- Zod Mini — bundle measurements and when not to use it:
  https://zod.dev/packages/mini
- Valibot — modular design and bundle-size claims:
  https://valibot.dev/
- ArkType — TypeScript-native syntax and performance claims:
  https://arktype.io/
- MCP TypeScript SDK v1 — required Zod peer dependency, `zod/v4` imports:
  https://github.com/modelcontextprotocol/typescript-sdk/tree/v1.x

**Forms, pending state, and errors**

- Next.js — Forms guide (Zod/Valibot validation, `useActionState`,
  `useFormStatus`, `useOptimistic`):
  https://nextjs.org/docs/app/guides/forms
- Next.js — Server Actions and Mutations (single response carrying data + UI,
  sequential dispatch, validate inputs, constrain return values):
  https://nextjs.org/docs/app/guides/server-actions
- Next.js — Data Security (DAL, `server-only`, validate client input, control
  return values):
  https://nextjs.org/docs/app/guides/data-security
- Next.js — Error Handling (expected errors as values, unexpected errors to error
  boundaries):
  https://nextjs.org/docs/app/getting-started/error-handling
- Next.js — `error.js` (error boundaries; production hides server error messages
  behind `digest`):
  https://nextjs.org/docs/app/api-reference/file-conventions/error
- Next.js — `revalidatePath`:
  https://nextjs.org/docs/app/api-reference/functions/revalidatePath
- React — `useActionState` (state, `isPending`, known errors returned, unknown
  errors thrown):
  https://react.dev/reference/react/useActionState
- React — `useOptimistic` (temporary state, reverts when the Action fails):
  https://react.dev/reference/react/useOptimistic
- React — `useFormStatus` (parent form, `pending`, `data`):
  https://react.dev/reference/react-dom/hooks/useFormStatus
- React — `<form>` (Server Functions, progressive enhancement, reset on success):
  https://react.dev/reference/react-dom/components/form

**Concurrency and database shape**

- PostgreSQL — Transaction Isolation (Read Committed re-evaluates `WHERE` against
  a concurrently updated row):
  https://www.postgresql.org/docs/current/transaction-iso.html
- PostgreSQL — Explicit Locking (`FOR UPDATE` semantics and conflicts):
  https://www.postgresql.org/docs/current/explicit-locking.html
- PostgreSQL — `RAISE` (SQLSTATE and custom error codes):
  https://www.postgresql.org/docs/current/plpgsql-errors-and-messages.html
- PostgREST — Errors (`PTxyz` custom HTTP status; `P0001` defaults to 400):
  https://docs.postgrest.org/en/stable/references/errors.html
- Supabase JS — `update()` and filters, `maybeSingle()`, and generated
  `Row`/`Insert`/`Update` types:
  https://supabase.com/docs/reference/javascript/update

## Open questions

- **Conflict recovery:** should the DM only be able to review/re-apply, or should
  there be an explicit "force overwrite" action? The recommendation is to omit
  force in v1; a force path would need its own confirmation and audit story.
- **Base snapshot:** does the approval UI need a visual diff? If yes, store a
  redacted `base_snapshot`; if no, `base_updated_at` is enough.
- **Metadata merge semantics:** replace vs shallow merge, and how a key is
  deleted. Owned by #23.
- **Empty text input:** does an empty optional text field mean `null` or `""`?
  Choose one at the form-mapping boundary and apply it consistently.
- **Create scope default:** does a new entity default to global (`campaign_id =
null`) or to the DM's active campaign? This is a product decision and affects
  which authority is checked.
- **`owner_id` assignment on create:** does the create form expose an owner
  picker, or does the server always default to the actor and leave reassignment
  to the update form?
- **Direct MCP updates:** if `update_record` remains a direct write (#37), must it
  also accept an `expected_updated_at`? If not, the agent path can still
  last-write-win around the draft flow.
- **Client-side validation:** is native HTML validation plus server errors enough
  for the first vertical slice, or is a shared client schema required before the
  D&D Beyond connect flow ships?
- **Optimistic discard:** is an optimistic draft-row removal worth the extra
  state, or is pending state sufficient for the approval queue?
