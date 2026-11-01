import { describe, expect, it } from "vitest"

import { visibilitySchema } from "./visibility"

describe("visibilitySchema", () => {
  it("accepts the two live values", () => {
    expect(visibilitySchema.parse("public")).toBe("public")
    expect(visibilitySchema.parse("private")).toBe("private")
  })

  it("rejects the retired secret value", () => {
    expect(visibilitySchema.safeParse("secret").success).toBe(false)
  })

  it("rejects empty and non-string input", () => {
    expect(visibilitySchema.safeParse("").success).toBe(false)
    expect(visibilitySchema.safeParse(null).success).toBe(false)
  })
})
