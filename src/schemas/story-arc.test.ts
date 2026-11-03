import { describe, expect, it } from "vitest"

import { storyArcCreateSchema, storyArcUpdateSchema } from "./story-arc"

describe("story arc schemas", () => {
  it("requires a name", () => {
    expect(storyArcCreateSchema.safeParse({}).success).toBe(false)
    expect(
      storyArcCreateSchema.safeParse({ name: "The Ember Conspiracy" }).success
    ).toBe(true)
  })

  it("accepts the status lifecycle and rejects anything else", () => {
    expect(
      storyArcCreateSchema.safeParse({ name: "A", status: "planned" }).success
    ).toBe(true)
    expect(
      storyArcCreateSchema.safeParse({ name: "A", status: "active" }).success
    ).toBe(true)
    expect(
      storyArcCreateSchema.safeParse({ name: "A", status: "completed" }).success
    ).toBe(true)
    expect(
      storyArcCreateSchema.safeParse({ name: "A", status: "archived" }).success
    ).toBe(false)
  })

  it("accepts the needed_resources shape", () => {
    const parsed = storyArcCreateSchema.parse({
      name: "A",
      needed_resources: {
        major: [
          {
            id: "00000000-0000-4000-8000-000000000001",
            name: "Gideon",
            type: "character",
          },
        ],
        minor: [{ name: "The Rusty Flagon", type: "location" }],
      },
    })

    expect(parsed.needed_resources?.major).toHaveLength(1)
    expect(parsed.needed_resources?.minor).toHaveLength(1)
  })

  it("accepts null needed_resources and rejects an empty update", () => {
    expect(
      storyArcCreateSchema.safeParse({ name: "A", needed_resources: null })
        .success
    ).toBe(true)
    expect(storyArcUpdateSchema.safeParse({}).success).toBe(false)
  })
})
