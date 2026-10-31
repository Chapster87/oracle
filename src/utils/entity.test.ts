import { describe, expect, it } from "vitest"

import { entityPath, isEntityType } from "./entity"

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
