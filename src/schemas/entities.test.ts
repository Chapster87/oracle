import { describe, expect, it } from "vitest"

import { characterCreateSchema, characterUpdateSchema } from "./character"
import { factionCreateSchema } from "./faction"
import { playerCreateSchema } from "./player"
import { ENTITY_SCHEMAS } from "./registry"

describe("create schemas", () => {
  it("requires a non-blank name", () => {
    expect(characterCreateSchema.safeParse({}).success).toBe(false)
    expect(characterCreateSchema.safeParse({ name: "   " }).success).toBe(false)
    expect(characterCreateSchema.safeParse({ name: "Gideon" }).success).toBe(
      true
    )
  })

  it("rejects unknown keys", () => {
    expect(
      characterCreateSchema.safeParse({ name: "Gideon", secrets: "x" }).success
    ).toBe(false)
  })

  it("rejects the retired secret visibility", () => {
    expect(
      characterCreateSchema.safeParse({ name: "Gideon", visibility: "secret" })
        .success
    ).toBe(false)
  })

  it("deduplicates tags", () => {
    const parsed = characterCreateSchema.parse({
      name: "Gideon",
      tags: ["orc", "orc", "undead"],
    })
    expect(parsed.tags).toEqual(["orc", "undead"])
  })

  it("accepts a null campaign_id for a global entity", () => {
    expect(
      characterCreateSchema.safeParse({ name: "Gideon", campaign_id: null })
        .success
    ).toBe(true)
  })
})

describe("update schemas", () => {
  it("rejects an empty payload", () => {
    expect(characterUpdateSchema.safeParse({}).success).toBe(false)
  })

  it("accepts a single field", () => {
    expect(
      characterUpdateSchema.safeParse({ alignment: "Lawful Good" }).success
    ).toBe(true)
  })

  it("accepts null to clear a field", () => {
    expect(characterUpdateSchema.safeParse({ alignment: null }).success).toBe(
      true
    )
  })
})

describe("metadata keys follow the registry", () => {
  const url = "https://www.dndbeyond.com/characters/1"

  it("allows ddb_url on players only", () => {
    expect(
      playerCreateSchema.safeParse({ name: "P", metadata: { ddb_url: url } })
        .success
    ).toBe(true)
    expect(
      characterCreateSchema.safeParse({ name: "C", metadata: { ddb_url: url } })
        .success
    ).toBe(false)
  })

  it("allows dm_notes on every type", () => {
    expect(
      factionCreateSchema.safeParse({
        name: "F",
        metadata: { dm_notes: "secret" },
      }).success
    ).toBe(true)
    expect(
      characterCreateSchema.safeParse({
        name: "C",
        metadata: { dm_notes: "secret" },
      }).success
    ).toBe(true)
  })

  it("rejects an unlisted metadata key", () => {
    expect(
      playerCreateSchema.safeParse({ name: "P", metadata: { other: "x" } })
        .success
    ).toBe(false)
  })
})

describe("registry", () => {
  it("covers every entity type", () => {
    expect(Object.keys(ENTITY_SCHEMAS).sort()).toEqual([
      "characters",
      "factions",
      "items",
      "locations",
      "players",
      "religions",
      "story_arcs",
    ])
  })
})
