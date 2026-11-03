import { describe, expect, it } from "vitest"

import type { Entity } from "@/types"

import { entityPath, entitySubtitle, isEntityType } from "./entity"

function entity(fields: Record<string, unknown>): Entity {
  return fields as unknown as Entity
}

describe("entity utils", () => {
  it("recognises known entity types", () => {
    expect(isEntityType("characters")).toBe(true)
    expect(isEntityType("players")).toBe(true)
    expect(isEntityType("dragons")).toBe(false)
  })

  it("builds a detail path", () => {
    expect(entityPath("players", "abc")).toBe("/players/abc")
  })
})

describe("entitySubtitle", () => {
  it("joins species and class for characters", () => {
    expect(
      entitySubtitle("characters", entity({ species: "Elf", class: "Ranger" }))
    ).toBe("Elf • Ranger")
  })

  it("joins type and sub-type for locations", () => {
    expect(
      entitySubtitle(
        "locations",
        entity({ type: "Forest", sub_type: "Ancient" })
      )
    ).toBe("Forest • Ancient")
  })

  it("uses the legacy class column for players", () => {
    expect(
      entitySubtitle("players", entity({ species: "Human", class_es: "Bard" }))
    ).toBe("Human • Bard")
  })

  it("joins type and rarity for items", () => {
    expect(
      entitySubtitle("items", entity({ type: "Weapon", rarity: "Rare" }))
    ).toBe("Weapon • Rare")
  })

  it("uses type for religions and alignment for factions", () => {
    expect(entitySubtitle("religions", entity({ type: "Cult" }))).toBe("Cult")
    expect(entitySubtitle("factions", entity({ alignment: "Neutral" }))).toBe(
      "Neutral"
    )
  })

  it("drops missing parts rather than printing separators", () => {
    expect(entitySubtitle("characters", entity({ species: "Elf" }))).toBe("Elf")
    expect(entitySubtitle("characters", entity({}))).toBe("")
  })
})
