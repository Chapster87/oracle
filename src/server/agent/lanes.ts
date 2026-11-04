import type { EntityType } from "@/types"

import { PROMPTS, type PromptKey } from "../prompts"

export interface Lane {
  id: string
  label: string
  description: string
  /** Prompt keys composed after the persona, in order. */
  skills: PromptKey[]
  /** The entity models this lane's `propose_record` may target. */
  proposeModels: EntityType[]
  /** Optional OpenRouter model id; falls back to `ORACLE_AGENT_MODEL`. */
  model?: string
}

/**
 * The v1 lane registry. A lane is a capability scope: its skills shape the
 * prompt, and its `proposeModels` is the hard boundary the tool enforces.
 */
export const LANES: Lane[] = [
  {
    id: "general",
    label: "General",
    description: "Ask about the campaign",
    skills: [],
    proposeModels: [],
  },
  {
    id: "forge-npc",
    label: "Forge NPC",
    description: "Create a character",
    skills: ["forge-npc"],
    proposeModels: ["characters"],
    model: "particle-ai/particle-1",
  },
  {
    id: "forge-location",
    label: "Forge Location",
    description: "Create a place",
    skills: ["forge-location"],
    proposeModels: ["locations"],
  },
  {
    id: "forge-religion",
    label: "Forge Religion",
    description: "Create a faith",
    skills: ["forge-religion"],
    proposeModels: ["religions"],
  },
  {
    id: "plan-story-arc",
    label: "Plan Story Arc",
    description: "Draft an arc and its resources",
    skills: [
      "plan-story-arc",
      "arc-template",
      "forge-npc",
      "forge-location",
      "forge-religion",
    ],
    proposeModels: ["characters", "locations", "religions", "story_arcs"],
  },
]

export function getLane(id: string): Lane | null {
  return LANES.find((lane) => lane.id === id) ?? null
}

/** `persona + lane skills + web binding`, per the channel-neutral decision. */
export function laneSystemPrompt(lane: Lane): string {
  return [
    PROMPTS.persona,
    ...lane.skills.map((key) => PROMPTS[key]),
    PROMPTS.web,
  ]
    .filter(Boolean)
    .join("\n\n---\n\n")
}

/** The model id a lane resolves to, with the global default as fallback. */
export function laneModel(lane: Lane): string {
  return (
    lane.model ?? process.env.ORACLE_AGENT_MODEL ?? "google/gemini-3.8-flash"
  )
}
