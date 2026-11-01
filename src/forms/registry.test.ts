import { describe, expect, it } from "vitest"

import type { Viewer } from "@/server/rbac"

import { allowedFields, fieldSpecsFor } from "./registry"

const dm: Viewer = { userId: "u-dm", role: "DM" }
const admin: Viewer = { userId: "u-admin", role: "ADMIN" }
const player: Viewer = { userId: "u-player", role: "PLAYER" }

describe("fieldSpecsFor", () => {
  it("always includes a required name field", () => {
    for (const type of [
      "characters",
      "locations",
      "factions",
      "players",
      "items",
      "religions",
    ] as const) {
      const name = fieldSpecsFor(type).find((spec) => spec.name === "name")
      expect(name?.required).toBe(true)
    }
  })

  it("omits tags for players, which has no tags column", () => {
    expect(fieldSpecsFor("players").some((s) => s.name === "tags")).toBe(false)
    expect(fieldSpecsFor("characters").some((s) => s.name === "tags")).toBe(
      true
    )
  })

  it("exposes visibility and campaign on every type, but never owner_id", () => {
    for (const type of ["characters", "locations", "players"] as const) {
      const names = fieldSpecsFor(type).map((spec) => spec.name)
      expect(names).toContain("visibility")
      expect(names).toContain("campaign_id")
      expect(names).not.toContain("owner_id")
    }
  })

  it("maps metadata keys to dotted names with the registry's authority", () => {
    const player = fieldSpecsFor("players")
    expect(player.find((s) => s.name === "metadata.ddb_url")).toBeDefined()
    expect(player.find((s) => s.name === "metadata.dm_notes")?.authority).toBe(
      "dm"
    )

    const character = fieldSpecsFor("characters")
    expect(character.find((s) => s.name === "metadata.dm_notes")).toBeDefined()
    expect(character.find((s) => s.name === "metadata.ddb_url")).toBeUndefined()
  })

  it("covers the location list and map fields", () => {
    const names = fieldSpecsFor("locations").map((spec) => spec.name)
    expect(names).toContain("points_of_interest")
    expect(names).toContain("map_data")
  })

  it("marks entity widgets with the option list the route must supply", () => {
    const region = fieldSpecsFor("locations").find(
      (s) => s.name === "region_id"
    )
    expect(region?.widget).toBe("entity")
    expect(region?.optionSource).toBe("locations")

    const campaign = fieldSpecsFor("characters").find(
      (s) => s.name === "campaign_id"
    )
    expect(campaign?.optionSource).toBe("campaigns")
  })
})

describe("allowedFields", () => {
  it("keeps dm fields for DM and ADMIN", () => {
    const specs = fieldSpecsFor("factions")
    expect(
      allowedFields(specs, dm).some((s) => s.name === "metadata.dm_notes")
    ).toBe(true)
    expect(
      allowedFields(specs, admin).some((s) => s.name === "metadata.dm_notes")
    ).toBe(true)
  })

  it("drops dm fields for a player", () => {
    const specs = fieldSpecsFor("factions")
    expect(
      allowedFields(specs, player).some((s) => s.name === "metadata.dm_notes")
    ).toBe(false)
  })

  it("leaves ordinary fields alone", () => {
    const specs = fieldSpecsFor("factions")
    expect(allowedFields(specs, player).some((s) => s.name === "name")).toBe(
      true
    )
  })
})
