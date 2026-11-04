import { describe, expect, it } from "vitest"

import { getLane, LANES, laneModel, laneSystemPrompt } from "./lanes"

describe("lanes", () => {
  it("exposes the five v1 lanes", () => {
    expect(LANES.map((lane) => lane.id)).toEqual([
      "general",
      "forge-npc",
      "forge-location",
      "forge-religion",
      "plan-story-arc",
    ])
  })

  it("scopes propose models per lane", () => {
    expect(getLane("forge-npc")?.proposeModels).toEqual(["characters"])
    expect(getLane("general")?.proposeModels).toEqual([])
    expect(getLane("plan-story-arc")?.proposeModels).toContain("story_arcs")
  })

  it("composes persona + skill + web binding", () => {
    const prompt = laneSystemPrompt(getLane("forge-npc")!)

    expect(prompt).toContain("Dungeon Master")
    expect(prompt).toContain("forge")
    expect(prompt).toContain("Web Channel Binding")
  })

  it("pins Particle-1 to forge-npc and defaults the rest to Gemini", () => {
    expect(laneModel(getLane("forge-npc")!)).toBe("particle-ai/particle-1")
    expect(laneModel(getLane("general")!)).toBe("google/gemini-3.8-flash")
  })
})
