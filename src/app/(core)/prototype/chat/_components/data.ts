export interface Lane {
  id: string
  label: string
  description: string
  canPropose: string
}

export const LANES: Lane[] = [
  {
    id: "general",
    label: "General",
    description: "Ask about the campaign",
    canPropose: "Nothing — read-only",
  },
  {
    id: "forge-npc",
    label: "Forge NPC",
    description: "Create a character",
    canPropose: "Characters",
  },
  {
    id: "forge-location",
    label: "Forge Location",
    description: "Create a place",
    canPropose: "Locations",
  },
  {
    id: "forge-religion",
    label: "Forge Religion",
    description: "Create a faith",
    canPropose: "Religions",
  },
  {
    id: "plan-story-arc",
    label: "Plan Story Arc",
    description: "Draft an arc and its resources",
    canPropose: "Characters, Locations, Religions",
  },
]

export type ProposalStatus = "pending" | "promoted" | "discarded"

export interface Proposal {
  id: string
  name: string
  type: string
  subtitle: string
  status: ProposalStatus
  lane: string
  summary: string
  fields: { label: string; value: string }[]
}

export const PROPOSALS: Proposal[] = [
  {
    id: "p1",
    name: "Gideon the Blacksmith",
    type: "Character",
    subtitle: "Dwarf • Artificer",
    status: "pending",
    lane: "forge-npc",
    summary:
      "A gruff blacksmith with a heart of gold, hiding a debt to the Ashen Covenant.",
    fields: [
      { label: "Species", value: "Dwarf" },
      { label: "Class", value: "Artificer" },
      { label: "Alignment", value: "Lawful Good" },
      { label: "Role", value: "Village blacksmith" },
    ],
  },
  {
    id: "p2",
    name: "The Rusty Flagon",
    type: "Location",
    subtitle: "Settlement • Tavern",
    status: "pending",
    lane: "forge-location",
    summary:
      "A low-beamed tavern where the town's secrets are traded over watered ale.",
    fields: [
      { label: "Type", value: "Settlement" },
      { label: "Sub-type", value: "Tavern" },
      { label: "Region", value: "The Ember Vale" },
    ],
  },
  {
    id: "p3",
    name: "The Order of the Ember",
    type: "Religion",
    subtitle: "Faith • Fire",
    status: "pending",
    lane: "plan-story-arc",
    summary: "A secretive order that tends the last ember of a dead god.",
    fields: [
      { label: "Type", value: "Faith" },
      { label: "Domains", value: "Fire, memory, sacrifice" },
      { label: "Role", value: "Antagonist" },
    ],
  },
]

export const PLAN = {
  title: "The Ember Conspiracy",
  summary:
    "A three-session arc about a dying god, a debt collector, and the town that buried both.",
  sessions: 3,
  targetLevel: "3–5",
}

export const TRANSCRIPT = [
  {
    role: "user" as const,
    text: "Plan a three-session arc around a dying god whose last ember is hidden in a blacksmith's forge. I want a tavern, a blacksmith, and a secretive order.",
  },
  {
    role: "agent" as const,
    text: "I'll draft the arc, then manifest the three resources it needs. I'm reading the existing campaign for continuity first.",
  },
]
