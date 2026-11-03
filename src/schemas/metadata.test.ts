import { describe, expect, it } from "vitest"

import { ddbUrlSchema } from "./metadata"

describe("ddbUrlSchema", () => {
  it("accepts dndbeyond.com hosts", () => {
    expect(
      ddbUrlSchema.safeParse("https://www.dndbeyond.com/characters/1").success
    ).toBe(true)
    expect(ddbUrlSchema.safeParse("https://dndbeyond.com/x").success).toBe(true)
  })

  it("rejects other hosts", () => {
    expect(ddbUrlSchema.safeParse("https://example.com/x").success).toBe(false)
    expect(
      ddbUrlSchema.safeParse("https://dndbeyond.com.evil.com/x").success
    ).toBe(false)
  })

  it("rejects strings that are not URLs", () => {
    expect(ddbUrlSchema.safeParse("not a url").success).toBe(false)
    expect(ddbUrlSchema.safeParse("").success).toBe(false)
  })
})
