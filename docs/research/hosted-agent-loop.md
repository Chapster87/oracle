# Research: Hosted Agent Loop and Model Selection

> **Update — provider changed to Google Gemini.** The DM has chosen Gemini as the
> primary model and ruled out Anthropic. This supersedes the Anthropic-specific
> portions of the recommendation below; the _architecture_ is unchanged (Vercel AI
> SDK, Node runtime, streaming, read-only + `propose_*` tool surface). See
> [Provider: Google Gemini](#provider-google-gemini) near the end of this file.

## Destination

A chat-driven, tool-calling agent hosted inside the Next.js app that runs
server-side, streams to a DM-only chat surface, and whose tool surface is a
**draft** variant of the existing MCP tools (`propose_*`, never `create_*`).

## Recommendation (summary)

Use the **Vercel AI SDK** (`ai` v7) with the **first-party Anthropic provider**
(`@ai-sdk/anthropic` v4), invoking it from a Next.js **Route Handler** on the
**Node.js runtime**, and stream the model's output back with the AI SDK UI
message protocol. Keep the provider API key and the model id in **server-only
environment variables**, resolved through a small per-lane config map. Expose
only `propose_*` (and read-only) tools to the model; persist proposals to a
draft store rather than calling `create_record`.

## Why the AI SDK over a raw provider SDK

Both routes are viable. The deciding factor here is how much of the agent loop
we would otherwise have to hand-roll.

| Concern                | AI SDK (`ai` + `@ai-sdk/anthropic`)                                                               | Raw provider SDK (e.g. `@anthropic-ai/sdk`)               |
| ---------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Streaming to a chat UI | `streamText` → `toUIMessageStream` → `createUIMessageStreamResponse`; paired `useChat` hook       | You define the wire format and the client parser yourself |
| Multi-step tool loop   | `stopWhen: isStepCount(n)` re-prompts with tool results until the condition is met                | Manual loop: run tool, append `tool_result`, re-request   |
| Tool schema shape      | `inputSchema` accepts a **JSON Schema** (as well as Zod), matching the existing MCP `inputSchema` | Native Anthropic `input_schema` JSON                      |
| Provider swap          | Change the model id / provider package, not the app code                                          | Rewrite request/response handling                         |
| MCP interop            | Built-in MCP client + `dynamicTool` for schema-less tools                                         | Not provided; you build the client                        |
| Cost                   | Extra dependencies; a leaky abstraction to learn                                                  | Fewest dependencies; full control over the wire           |

The existing MCP tool definitions in `src/server/mcp/oracle-db.ts` are already
plain JSON Schema objects (`{ name, description, inputSchema }`). The AI SDK's
tool helper accepts a JSON Schema for `inputSchema`, so the draft-tool shapes can
mirror the MCP shapes directly and stay consistent with
`SupabaseRecordManager`. Fewer sources of divergence between the MCP server and
the hosted agent is worth the extra dependency.

Do **not** drive this off the Vercel AI Gateway for the first version. The
gateway is convenient for reaching many providers with one key, but it routes
requests through Vercel and adds a credential the DM-only, self-hosted posture
does not need. Go direct to Anthropic with `@ai-sdk/anthropic`; the gateway can
be a later swap if multi-provider routing becomes a requirement.

## Streaming on the App Router

Route Handlers are the correct surface. Next.js documents Route Handlers built
on the Web `Request`/`Response` APIs, with streaming explicitly called out as
the pattern used with LLM SDKs, and a `runtime` segment config to pick the
Node.js vs Edge runtime (https://nextjs.org/docs/app/api-reference/file-conventions/route).

Use the **Node.js runtime** (`export const runtime = 'nodejs'`). The privileged
Supabase client path in this repo (`src/utils/supabase-mcp.ts`) loads
`.env.local` via `dotenv` and resolves `process.cwd()`, and the record manager
depends on `@supabase/supabase-js`; none of that is a good fit for the Edge
runtime. Forcing Node also keeps the MCP server and the agent on the same
execution model.

The AI SDK's documented Next.js App Router flow is a `POST` route handler that
calls `streamText` and returns a UI message stream
(https://ai-sdk.dev/docs/getting-started/nextjs-app-router):

```ts
const result = streamText({ model, messages })
return createUIMessageStreamResponse({
  stream: toUIMessageStream({ stream: result.stream }),
})
```

This is a plain `Response`, so it streams through the Next.js Route Handler
without any special configuration.

## Where the API key and model config live

- **API key**: server-only env var `ANTHROPIC_API_KEY`. The Anthropic provider
  reads this variable by default; it is sent as the `x-api-key` header and is
  never serialized into a client bundle (https://ai-sdk.dev/providers/ai-sdk-providers/anthropic).
  The route handler runs server-side, so the browser only ever posts `messages`
  and receives a stream — the key never reaches the client. Follow the repo's
  existing split: `NEXT_PUBLIC_*` for public values, unprefixed names for
  secrets such as `SUPABASE_SERVICE_ROLE_KEY` in `src/utils/supabase-mcp.ts`.
- **Model id**: server-only `ORACLE_AGENT_MODEL`, default in code, e.g.
  `claude-sonnet-5-5` (listed as a supported Anthropic model with tool use in
  the provider docs above). Centralize resolution so a **lane** can override
  the default without touching code:

  ```ts
  // server-only
  const MODEL_BY_LANE = {
    dm_assistant: process.env.ORACLE_AGENT_MODEL ?? "claude-sonnet-5-5",
    // future lanes can pin a cheaper/faster model
    // dm_editor: "claude-haiku-5-5",
  } as const
  ```

- **Per-user / per-lane**: nothing user-specific belongs in the key or model
  choice in v1. Per-user behavior is authorization (below) plus prompt context,
  not a different credential. Treat the lane map as the single seam for future
  per-lane model tuning.

## DM-only surface

The route handler must authenticate and authorize server-side before it touches
the model. Reject non-DM callers with `403`. This reuses the role model from
`docs/research/auth-flow-investigation.md` (`profiles.role in ('DM','ADMIN')`);
until that lands, a DM-only session check is the gate. Authorization is
independent of the model call and must not be delegated to the prompt.

## Draft tool surface (`propose_*`)

The existing MCP tools are `get_records`, `get_record_by_id`, `create_record`,
`update_record`, `delete_record`, `check_migrations`
(`src/server/mcp/oracle-db.ts`). The hosted agent gets:

- **Read-only tools** the agent may call freely: `get_records`,
  `get_record_by_id`, `check_migrations` — these already do not mutate.
- **Proposal tools** in place of every mutating tool, keeping the MCP
  `{ name, description, inputSchema }` shape and the `model`/`id`/`data`
  argument conventions:
  - `propose_record` (draft of `create_record`)
  - `propose_update` (draft of `update_record`)
  - `propose_delete` (draft of `delete_record`)

Each proposal tool writes to a **draft store** — a staging table or in-memory
queue — and returns a `draftId` plus `status: "pending"`. It must not call
`SupabaseRecordManager.createRecord/updateRecord/deleteRecord` directly. The
mutating methods in `src/server/cms/adapters/supabase-record-manager.ts` stay
the execution path for an explicit DM approval step, outside the model loop.

This mirrors the AI SDK's own approval concept, where a tool can pause and
surface a request instead of executing immediately
(https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling), but we keep the
staging in our own draft store so the pending proposals are durable and
reviewable independently of the chat session.

## Sketch: route handler and agent loop

```ts
// src/app/api/agent/route.ts
import "server-only";
import { anthropic } from "@ai-sdk/anthropic";
import {
  streamText,
  convertToModelMessages,
  isStepCount,
  tool,
  createUIMessageStreamResponse,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { requireDm } from "@/server/auth/require-dm";
import { draftStore } from "@/server/cms/drafts/draft-store";
import { personaSystemPrompt } from "@/server/agent/persona";

export const runtime = "nodejs";   // see Streaming section: keep off Edge
export const maxDuration = 60;

// Draft variant of create_record; shape mirrors src/server/mcp/oracle-db.ts.
const propose_record = tool({
  description:
    "Propose a NEW record as a draft for DM approval. Does not write to the database.",
  inputSchema: z.object({
    model: z.string().describe("Target table, e.g. 'characters'."),
    data: z.record(z.unknown()).describe("Proposed record data."),
  }),
  execute: async ({ model, data }, { toolCallId }) => {
    const draft = await draftStore.propose({ kind: "create", model, data, toolCallId });
    return { draftId: draft.id, status: "pending" as const };
  },
});

export async function POST(req: Request) {
  const dm = await requireDm(req);              // server-side authz
  if (!dm) return new Response("Forbidden", { status: 403 });

  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: anthropic(process.env.ORACLE_AGENT_MODEL ?? "claude-sonnet-5-5"),
    system: personaSystemPrompt(dm),
    messages: await convertToModelMessages(messages),
    stopWhen: isStepCount(8),                    // bounded tool loop
    tools: {
      get_records: /* read-only */,
      get_record_by_id: /* read-only */,
      propose_record,
      propose_update,
      propose_delete,
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
```

`stopWhen: isStepCount(n)` is the bounded multi-step loop: the model may call a
tool, receive the result, and continue until the step cap
(https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling). Read-only tools
can reuse `SupabaseRecordManager` via a service-role client exactly as
`src/server/mcp/oracle-db.ts` does; write tools route to the draft store.

## Concrete library / version choice

- `ai@^7` (latest published at time of writing: `7.0.140`) —
  https://registry.npmjs.org/ai/latest
- `@ai-sdk/anthropic@^4` (latest published: `4.0.79`) —
  https://registry.npmjs.org/@ai-sdk/anthropic/latest
- `@ai-sdk/react` (same release train as `ai`) for the `useChat` hook on the
  DM chat page
- `zod` — required peer dependency of both packages
  (`^3.25.76 || ^4.1.8`); not currently in `package.json`

Node engine requirement is `>=22` for both packages. Confirm the deploy target
meets that before adding them.

## Trade-offs and constraints

- **AI SDK abstraction vs control.** We trade a little control over the exact
  wire format for a maintained tool loop, streaming protocol, and UI message
  handling. Acceptable given the draft-tool surface is simple and the tool
  schemas already exist as JSON Schema.
- **Node runtime, not Edge.** Streaming works on both, but this repo's
  Supabase/`dotenv`/`process.cwd()` usage pushes us to Node. Slightly slower
  cold starts than Edge; irrelevant for a DM-only surface.
- **Key handling.** One provider key in server env. Never place it behind
  `NEXT_PUBLIC_`. The Anthropic provider defaults to `ANTHROPIC_API_KEY`; do not
  pass a key from the client.
- **Draft-only tools.** Enforced structurally: the agent is given no
  `create_*`/`update_*`/`delete_*` tool, so it cannot mutate even if prompted
  to. Approval writes go through the existing record manager.

## Assumptions and open questions

- **"Lane" definition.** I have treated a _lane_ as a named agent surface
  (v1: a single `dm_assistant` lane) that may later pin its own model/provider.
  If lanes are meant to be per-user or per-campaign, the config map should key
  on that instead.
- **Draft store shape.** The findings assume a staging table (or queue) with a
  DM approval UI. The staging schema and approval flow are not specified in this
  ticket and should be a follow-up.
- **Session mechanism.** `requireDm` assumes a server-readable session/role
  (per the auth research). Until Supabase Auth is wired, the gate needs a
  stopgap.
- **Provider choice.** Anthropic is assumed as primary because the existing MCP
  and persona work is Claude-oriented; the AI SDK makes OpenAI a config change,
  not a rewrite.

## Provider: Google Gemini

The chosen provider. This supersedes the Anthropic assumption in the sections above.

- **Package:** `@ai-sdk/google`, a first-party AI SDK provider (verified `4.0.95`;
  Node `>=22`; peer `zod`). Only the single provider import changes; the rest of the
  route handler and agent loop are unchanged.
- **API key:** server-only env var `GOOGLE_GENERATIVE_AI_API_KEY` (the provider's
  default). Never `NEXT_PUBLIC_*`.
- **Model id:** server-only `ORACLE_AGENT_MODEL`, e.g. `gemini-3.8-flash` (fast) or
  `gemini-3.1-pro-preview` (deeper), resolved through the same per-lane map.
- **Use the direct provider, not the Gateway.** Importing `google` from
  `@ai-sdk/google` and calling `google('<model-id>')` hits the Google API directly.
  A bare **model string** (e.g. `"google/gemini-3.8-flash"`) routes through the
  Vercel AI Gateway by default — avoid the string form to keep the direct,
  self-hosted posture decided in the streaming and key-handling sections.
- **Thinking:** Gemini 3-and-later uses
  `providerOptions.google.thinkingConfig.thinkingLevel`
  (`'minimal' | 'low' | 'medium' | 'high'`) rather than `thinkingBudget`.
- **Tool-calling caveat:** the Google API accepts a **subset of JSON Schema** for
  tool and structured output and may reject very large or deeply nested schemas.
  Our `propose_*` inputs are shallow (`model`, `id`, `data`), so this is low-risk,
  but keep them simple. Structured outputs are enabled by default and are required
  for tool calling.
- **Alternate still available:** DeepSeek via `@ai-sdk/deepseek` (`3.0.64`, also
  Node `>=22`). If more than one provider is used at once, widen the per-lane map
  to `{ provider, model }` rather than a bare model id.

Sources: `@ai-sdk/google` provider docs — https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai ; npm — https://registry.npmjs.org/@ai-sdk/google/latest

## Primary sources

- AI SDK by Vercel — introduction: https://ai-sdk.dev/docs/introduction
- AI SDK Core — tool calling and multi-step calls: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling
- AI SDK — Next.js App Router quickstart (route handler + streaming): https://ai-sdk.dev/docs/getting-started/nextjs-app-router
- AI SDK — Anthropic provider (setup, `ANTHROPIC_API_KEY`, models, tool streaming): https://ai-sdk.dev/providers/ai-sdk-providers/anthropic
- Next.js — Route Handlers (Web APIs, streaming, `runtime` config): https://nextjs.org/docs/app/api-reference/file-conventions/route
- Anthropic — Tool use with Claude (client tools, `tool_use`/`tool_result` loop, strict schema): https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview
- npm registry — `ai` latest: https://registry.npmjs.org/ai/latest
- npm registry — `@ai-sdk/anthropic` latest: https://registry.npmjs.org/@ai-sdk/anthropic/latest
