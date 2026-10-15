# Research: Channel-Neutral Skills as Prompt Source of Truth

## Question

How can the repo's authored agent rules (`.agents/skills/*/SKILL.md` and
`docs/agents/persona.md`) feed a future **server-side web agent** without forking
into two rule sets?

The in-editor coding agent loads these files as "skills". A chat surface inside
the web app must run against the **same** rules so the DM assistant keeps one
personality. Duplicating the rules into a separate web-only prompt set is the
failure mode to avoid.

## What the repo actually contains

The rules are small and entirely markdown. Before choosing a pipeline, it is worth
naming what is actually in the files, because the "knowledge / procedure / binding"
split behaves very differently depending on the skill.

| File | Knowledge (channel-neutral) | Procedure (shape shared) | Binding (channel-specific) |
| --- | --- | --- | --- |
| `forge-npc` | "breathe life into a persona" definition | Elicit → Manifest → Populate → Verify | `Campaign/Characters/[Name].md`; `NPC Template`; completion = file exists |
| `forge-location` | "give physical form … to a point" | Elicit → Manifest → Populate → (optional) Visualize | three subdirectories; `Location Template`; puzzle path + link; ASCII `Map` section |
| `forge-religion` | "define the divine forces" | Elicit → Manifest → Populate | `Campaign/Religions/[Name].md`; `Religion Template` |
| `plan-story-arc` | "bridge sessions into a narrative" | Draft arc → scan `[[brackets]]` → create resources → convert links | `Campaign/Planning/Arc-[Name].md`; wikilink → markdown link conversion |
| `chronicle-story` | "weave threads into the tapestry" | (thin) record → propagate → finalize | episode dir; `Campaign/_StoryLog.md`; `Role in Campaign` sections; `/Complete/` moves |
| `next-episode` | "advance the timeline" | (thin) → Manifest | `Campaign/Episodes/`; `E[n].md`; `Episode Template` |
| `share-content` | "reveal surface, hide machinery" | Sanitize → Strip → Validate | `-Share.md` file; markdown-link stripping rules |
| `persona.md` | tone, completeness, uniqueness/continuity, encounter balancing, naming | — | `Rules/` refs, `Campaign/` paths, template list, wikilink-vs-markdown linking |

Two observations drive the recommendation:

1. **The binding is the bulk, not the residue.** Measured in lines, most of each
   `forge-*`/`chronicle`/`next-episode` skill is file paths, template names, and
   link mechanics. The genuinely channel-neutral payload is the one-sentence verb
   definition plus step 1 ("elicit / define"), plus the persona's quality bars.
2. **`persona.md` has a clean seam.** Everything above `## File Creation & Structure`
   is channel-neutral; the "File Creation & Structure", "Content Templates", and
   "Integration Modules" sections are the channel-specific binding.

## 1. Loading markdown as prompt assets in Next.js 16

The repo is Next.js `^16.2.12`, React 19, App Router, TypeScript, and has **no
`next.config.*`** today. In Next 16, **Turbopack is the default bundler** for dev
and production; webpack is an opt-out (`next build --webpack`).

### Options considered

| Option | How it works | Verdict |
| --- | --- | --- |
| **A. Compile as MDX** (`@next/mdx`) | Transforms `.md`/`.mdx` into React components for **rendering to HTML** | ✗ Wrong tool. We want prose in a string, not HTML/JSX. Adds deps; `@next/mdx` does **not** support YAML frontmatter by default. |
| **B. Runtime filesystem read** (`fs`) | Read the markdown from disk when the route/action runs | ✗ Fragile on serverless. `fs` is server-only; a dynamic `fs.readdirSync(…)` is **not statically traceable**, so files that are not imported are omitted from the deployment bundle. |
| **C. Build-time raw import** | Bundle each markdown file into the server build as a **string constant** | ✓ Recommended. No runtime fs, no deployment-tracing globs, missing file becomes a build error. |

### Primary-source findings

- **Raw text module type.** Turbopack exposes module types `raw` and `text`, both of
  which "Export the contents as a string." They can be set globally via
  `turbopack.rules[glob].type`, or per-import with the `turbopackModuleType`
  import attribute. Rule globs match on file name unless the glob contains a `/`,
  in which case they match the project-relative path — so scope the rule to
  `*.agents/skills/**/*.md` rather than all `*.md`. Rules support `condition`
  (`browser` / `{ not: 'browser' }` / `node` / `prod` / etc.).
- **`resolveExtensions`** can add `.md` so extensionless imports resolve, though
  importing the explicit path is clearer.
- **Output File Tracing.** `next build` uses `@vercel/nft` to "statically analyze
  `import`, `require`, and `fs` usage" and trace the files a route needs. A runtime
  `fs` read of the skills directory would additionally require
  `outputFileTracingIncludes`, and that only applies to **server** traces — "Edge
  Runtime routes are not affected", and static pages are not affected. Build-time
  imports sidestep this entirely.
- **Runtime.** Route Handlers default to `runtime = 'nodejs'`; the `'edge'` runtime
  is **deprecated** in Next 16. For an LLM route, the docs' streaming example is a
  `route.ts` `POST` handler returning a `ReadableStream`. A Node route is the right
  home for the composer, and it can do both bundled-import and any DB/tool calls.

## 2. Recommended pipeline

Keep the markdown as the **single source of truth** and import it at build time
into a typed server module.

1. **Stay put.** Author skills and persona where they are. Do not create a second
   copy under `src/`.

2. **Enable raw text import.** Add `next.config.ts`:

   ```ts
   import type { NextConfig } from "next";

   const nextConfig: NextConfig = {
     turbopack: {
       rules: {
         ".agents/skills/**/*.md": { type: "text" },
         "docs/agents/persona.md": { type: "text" },
         "docs/agents/channels/**/*.md": { type: "text" },
       },
     },
   };

   export default nextConfig;
   ```

3. **Declare the module shape** once:

   ```ts
   // src/types/markdown.d.ts
   declare module "*.md" {
     const content: string;
     export default content;
   }
   ```

4. **Load, strip, and key by lane** in a thin `src/server/prompts` module. Import
   each skill explicitly so a rename becomes a compile error:

   ```ts
   import forgeNpc from "../../../.agents/skills/forge-npc/SKILL.md";
   import persona from "../../../docs/agents/persona.md";
   import webBinding from "../../../docs/agents/channels/web.md";

   /** Strips a leading `---` YAML frontmatter block, leaving the body. */
   function stripFrontmatter(md: string): string {
     return md.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
   }

   export const PROMPTS: Record<string, string> = {
     "forge-npc": stripFrontmatter(forgeNpc),
     // ...
   };
   ```

   Frontmatter is dropped because the body is what steers the model; if `name` /
   `description` are needed for routing, parse the block with a few lines or
   `gray-matter` (the dependency the Next MDX docs explicitly name). `persona.md`
   has no frontmatter, so the strip is a no-op.

5. **Compose at request time** in one `route.ts` (or Server Action):

   ```ts
   const system = [stripFrontmatter(persona), PROMPTS[lane], webBinding]
     .filter(Boolean)
     .join("\n\n---\n\n");
   ```

6. **Allowlist the web lanes.** Export only the skills the chat surface offers.
   Skills that are inherently editor-only (repo/issue-tracker planning such as the
   global `wayfinder` / `triage` / `to-tickets` family) are simply never imported
   and need no adaptation.

### Single module vs per-lane

Use a **single typed module with a lane-keyed export**. With one persona and ~8
short skills the total payload is a few kilobytes and is trivially bundled. The
keyed shape means a later split into per-lane lazy imports or one-module-per-lane
is a change to the loader only, not to call sites. Splitting now would buy nothing
and cost a shared registry.

## 3. Evaluating the knowledge / procedure / binding split

The hypothesis is **directionally correct but mis-proportioned**, and acting on it
literally would be a net loss.

**Where it holds.** The three categories are real, and the persona confirms it:
there is an unambiguous line between the channel-neutral tone/quality prose and the
channel-specific "File Creation & Structure / Content Templates / Integration
Modules" sections. "Editor-only skills stay editor-native" is also right and cheap
to honor via the allowlist.

**Where it fails.** For the `forge-*`, `chronicle`, `next-episode`, and `share`
skills, the **binding is most of the file**. Peel it out and the leftover
"procedure" collapses to something like "elicit a concept, persist it, verify" —
true, but no longer steering. The concreteness (which directory, which template,
which link syntax, what "done" means) *is* the working part of the prompt. A tidy
three-layer refactor would produce generic prompts and lose that.

**Concrete failure mode to avoid.** Refactoring each `SKILL.md` into
`knowledge.md` + `procedure.md` + `binding.json` gives three artifacts to keep in
sync per skill, breaks the editor agent's self-contained instructions, and makes a
skill unreadable end-to-end in review. That is worse than the duplication we set
out to prevent.

**Recommended shape: adapter, not fork.** Keep `SKILL.md` intact and verbatim as
the source of truth, and add a small **channel binding overlay** that the web side
appends. The overlay supplies only the channel-specific nouns — where the artifact
goes (a Supabase table via the existing MCP tools in
`src/server/mcp/oracle-db.ts`, e.g. `create_record`), what the "template" is (the
DB entity shape), and how links are expressed (app routes rather than local
markdown). Crucially, author the overlay as **markdown too**
(`docs/agents/channels/web.md`) so *all* prompt text stays in versioned prose and
none of it is duplicated inside TypeScript. The rules stay singular; the channel
maps the verbs.

The seam is small because the web agent's "verbs" already exist: the MCP bridge
exposes `create_record` / `update_record` / etc., which are exactly what the file
verbs in `forge-*` map onto.

## 4. ADR framing

Per `docs/agents/domain.md`, this repo uses a single-context layout: `CONTEXT.md`
at the root and ADRs in `docs/adr/` (currently empty). A candidate record:

- **Path:** `docs/adr/0001-single-source-skill-prompts.md`
- **Status:** Proposed
- **Context:** Two surfaces (in-editor coding agent, in-app web chat) must run
  against one set of rules. Markdown under `.agents/skills/` and
  `docs/agents/persona.md` is the authored source of truth; the web app needs the
  same prose without a runtime filesystem dependency.
- **Decision:** Import skills and persona at **build time** as raw text via a
  Turbopack `text` module rule into a typed server module; compose
  `persona + skill + channel-binding overlay` per request; keep `SKILL.md` files
  unchanged (no three-layer rewrite); allowlist which skills the web channel
  offers.
- **Consequences:** Changing a rule requires a rebuild/redeploy — acceptable and
  arguably desirable, since rules are PR-gated. A missing/renamed skill fails the
  build instead of 404ing at runtime. No `outputFileTracingIncludes` globs and no
  runtime `fs`. Editor-only skills stay editor-native via the allowlist.
  `CONTEXT.md`'s "Agent Integration" section should note the shared-source rule.
- **Rejected:** Runtime `fs` reads (non-traceable on serverless; Edge cannot read
  disk); `@next/mdx` compilation (renders to HTML and drops frontmatter by
  default); duplicating rules into a web-only prompt set.

## Open questions / assumptions

- **Directory-relative prompt path.** The skills live in a dot-directory
  (`.agents/`) that sits *inside* the Turbopack project root, so it should resolve;
  files outside the root do not. Verify the first `next build` picks up the
  scoped rule globs on Windows (paths are normalized to `/`).
- **Where the ruleset lives at runtime.** `persona.md` points at `Rules/5e Ruleset/`
  on disk. The web channel must decide whether that stays a file dependency or moves
  to Supabase; the binding overlay is where that answer belongs.
- **Lane selection.** Whether the chat picks a skill by an explicit UI lane or a
  router/embedding. Either way the loader's lane-keyed export is the interface.
- **Persona drift.** Adding a channel section to `persona.md` versus a separate
  overlay is a judgment call; the overlay keeps the shared persona pristine, which
  is the safer default.

## Sources

- Next.js — How to use markdown and MDX: https://nextjs.org/docs/app/guides/mdx
  (MDX compiles to components; frontmatter not supported by default; `fs`/globby server-only)
- Next.js — `turbopack` config: https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack
  (`raw`/`text` module types; `turbopack.rules`; `condition`; `resolveExtensions`; import attributes)
- Next.js — `output` / Output File Tracing: https://nextjs.org/docs/app/api-reference/config/next-config-js/output
  (nft static analysis of `import`/`require`/`fs`; `outputFileTracingIncludes`; routes on Edge unaffected)
- Next.js — Route Segment Config: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
  (`runtime` defaults to `nodejs`; `edge` deprecated)
- Next.js — `runtime`: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config/runtime
  (Edge Runtime deprecated)
- Next.js — `route.js`: https://nextjs.org/docs/app/api-reference/file-conventions/route
  (Route Handlers, streaming LLM example, nodejs default)
- Next.js 16 release notes: https://nextjs.org/blog/next-16
  (Turbopack is the default bundler; opt out with `next build --webpack`)
