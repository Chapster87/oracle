import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  tool,
  toUIMessageStream,
  type UIMessage,
} from "ai"
import * as z from "zod"

import type { EntityType } from "@/types"

import { getLane, laneModel, laneSystemPrompt } from "@/server/agent/lanes"
import { createSupabaseServerClient, getViewerOrNull } from "@/server/auth"
import { getCampaignContext } from "@/server/campaigns"
import { createBatch, proposeDraft } from "@/server/cms/drafts"

export const runtime = "nodejs"
export const maxDuration = 60

/** The exact fields each model accepts, surfaced in the tool schema. */
const FIELD_HINTS: Record<string, string> = {
  characters:
    "name (max 200), species (short label, max 100), class (short label, max 100), alignment (short label, max 100), appearance (long prose), personality (long prose), role (short label, max 100 — put narrative in personality/appearance), is_deceased (boolean), tags",
  locations:
    "name (max 200), type (short label, max 100), sub_type (short label, max 100), region_id (uuid), overview (long prose), history (long prose), inhabitants (long prose), points_of_interest (array of short strings), map_data, tags",
  religions:
    "name (max 200), type (short label, max 100), overview (long prose), domains_teachings (long prose), worship_rituals (long prose), clergy_followers (long prose), history_myths (long prose), role_in_campaign (long prose), tags",
  story_arcs:
    "name (max 200), status (planned|active|completed), target_level (short, max 50), session_count (integer), overview (long prose), content (full plan markdown), needed_resources ({ major: [{ name, type }], minor: [{ name, type }] }), tags",
}

/**
 * The hosted agent loop. DM-only, lane-scoped, and draft-only: the model gets
 * read tools plus `propose_record`, never a live write.
 */
export async function POST(req: Request) {
  const viewer = await getViewerOrNull()
  if (!viewer || (viewer.role !== "DM" && viewer.role !== "ADMIN")) {
    return new Response("Forbidden", { status: 403 })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return new Response("OPENROUTER_API_KEY is not set", { status: 500 })
  }

  const { messages, laneId }: { messages: UIMessage[]; laneId: string } =
    await req.json()

  const lane = getLane(laneId)
  if (!lane) return new Response("Unknown lane", { status: 400 })

  const { active } = await getCampaignContext()
  const campaignId = active?.id ?? null

  const batch = await createBatch(campaignId, viewer)
  if (!batch.ok) {
    return new Response(batch.formError ?? "Could not create a batch", {
      status: 400,
    })
  }

  const openrouter = createOpenRouter({ apiKey })

  const fieldHint = lane.proposeModels
    .map((model) => `${model}: ${FIELD_HINTS[model]}`)
    .join("; ")

  // Reasoning parts carry provider signatures that OpenRouter strips when they
  // are incomplete, which produces a warning and can corrupt later turns. The
  // authoring chat does not need cross-turn reasoning, so drop those parts.
  const history = messages.map((message) =>
    message.role === "assistant"
      ? {
          ...message,
          parts: message.parts.filter((part) => part.type !== "reasoning"),
        }
      : message
  )

  const result = streamText({
    model: openrouter(laneModel(lane)),
    system: laneSystemPrompt(lane),
    messages: await convertToModelMessages(history),
    stopWhen: isStepCount(8),
    tools: {
      get_records: tool({
        description: "Fetch records for a model.",
        inputSchema: z.object({ model: z.string() }),
        execute: async ({ model }) => {
          const db = await createSupabaseServerClient()
          const { data, error } = await db.from(model).select("*").limit(50)
          if (error) return { error: error.message }
          return { records: data }
        },
      }),
      get_record_by_id: tool({
        description: "Fetch one record by id.",
        inputSchema: z.object({ model: z.string(), id: z.uuid() }),
        execute: async ({ model, id }) => {
          const db = await createSupabaseServerClient()
          const { data, error } = await db
            .from(model)
            .select("*")
            .eq("id", id)
            .maybeSingle()
          if (error) return { error: error.message }
          return { record: data }
        },
      }),
      propose_record: tool({
        description: `Propose a new record as a draft. Does not write to the live tables. Allowed models: ${lane.proposeModels.join(", ")}. Use only these fields — ${fieldHint}.`,
        inputSchema: z.object({
          model: z
            .string()
            .describe(`One of: ${lane.proposeModels.join(", ")}`),
          data: z
            .record(z.string(), z.unknown())
            .describe(
              "The record fields. Use only the fields listed in the tool description."
            ),
        }),
        execute: async ({ model, data }) => {
          if (!lane.proposeModels.includes(model as EntityType)) {
            return { error: `The ${lane.label} lane cannot propose ${model}.` }
          }

          const draft = await proposeDraft(
            {
              kind: "create",
              model: model as EntityType,
              campaignId,
              payload: data,
              batchId: batch.id,
              lane: lane.id,
            },
            viewer
          )

          if (!draft.ok) {
            const details = draft.fieldErrors
              ? Object.entries(draft.fieldErrors)
                  .map(([key, messages]) => `${key}: ${messages.join(", ")}`)
                  .join("; ")
              : draft.formError

            return { error: details ?? "Could not stage the draft." }
          }

          return { draftId: draft.id, batchId: batch.id, status: "pending" }
        },
      }),
    },
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  })
}
