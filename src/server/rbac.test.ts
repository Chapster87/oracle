import { describe, expect, it } from "vitest"

import type { EntityScope } from "./rbac"
import { canRead, canWrite, isDmRole, type Viewer } from "./rbac"

const admin: Viewer = { userId: "u-admin", role: "ADMIN" }
const dm: Viewer = { userId: "u-dm", role: "DM" }
const player: Viewer = { userId: "u-player", role: "PLAYER" }

const globalPublic: EntityScope = {
  campaignId: null,
  ownerId: "u-dm",
  visibility: "public",
}
const globalPrivate: EntityScope = {
  campaignId: null,
  ownerId: "u-dm",
  visibility: "private",
}
const campaignPublic: EntityScope = {
  campaignId: "c1",
  ownerId: "u-dm",
  visibility: "public",
}
const campaignPrivate: EntityScope = {
  campaignId: "c1",
  ownerId: "u-dm",
  visibility: "private",
}

const runsC1 = (id: string) => id === "c1"
const memberOfC1 = (id: string) => id === "c1"
const noCampaigns = () => false

describe("isDmRole", () => {
  it("treats ADMIN as a DM", () => {
    expect(isDmRole("ADMIN")).toBe(true)
    expect(isDmRole("DM")).toBe(true)
    expect(isDmRole("PLAYER")).toBe(false)
  })
})

describe("canWrite", () => {
  it("authorizes ADMIN everywhere", () => {
    for (const scope of [
      globalPublic,
      globalPrivate,
      campaignPublic,
      campaignPrivate,
    ]) {
      expect(canWrite(admin, scope, noCampaigns)).toBe(true)
    }
  })

  it("authorizes a global DM for global rows only", () => {
    expect(canWrite(dm, globalPublic, noCampaigns)).toBe(true)
    expect(canWrite(dm, globalPrivate, noCampaigns)).toBe(true)
    expect(canWrite(dm, campaignPublic, noCampaigns)).toBe(false)
  })

  it("authorizes a campaign DM for that campaign", () => {
    expect(canWrite(dm, campaignPrivate, runsC1)).toBe(true)
  })

  it("never grants a player write, even over their own row", () => {
    const owned: EntityScope = { ...globalPrivate, ownerId: "u-player" }
    expect(canWrite(player, owned, noCampaigns)).toBe(false)
    expect(canWrite(player, campaignPublic, noCampaigns)).toBe(false)
  })
})

describe("canRead", () => {
  it("lets ADMIN read everything", () => {
    for (const scope of [
      globalPublic,
      globalPrivate,
      campaignPublic,
      campaignPrivate,
    ]) {
      expect(canRead(admin, scope, noCampaigns, noCampaigns)).toBe(true)
    }
  })

  it("lets a global DM read every global row", () => {
    expect(canRead(dm, globalPublic, noCampaigns, noCampaigns)).toBe(true)
    expect(canRead(dm, globalPrivate, noCampaigns, noCampaigns)).toBe(true)
  })

  it("hides another campaign from a global DM", () => {
    expect(canRead(dm, campaignPublic, noCampaigns, noCampaigns)).toBe(false)
  })

  it("lets a campaign DM read its campaign", () => {
    expect(canRead(dm, campaignPrivate, runsC1, memberOfC1)).toBe(true)
  })

  it("lets a member read public and owned rows in its campaign", () => {
    expect(canRead(player, campaignPublic, noCampaigns, memberOfC1)).toBe(true)
    expect(
      canRead(
        player,
        { ...campaignPrivate, ownerId: "u-player" },
        noCampaigns,
        memberOfC1
      )
    ).toBe(true)
  })

  it("hides private rows from a member who does not own them", () => {
    expect(canRead(player, campaignPrivate, noCampaigns, memberOfC1)).toBe(
      false
    )
  })

  it("hides a campaign entirely from a non-member", () => {
    expect(canRead(player, campaignPublic, noCampaigns, noCampaigns)).toBe(
      false
    )
  })

  it("lets a player read public globals and their own rows", () => {
    expect(canRead(player, globalPublic, noCampaigns, noCampaigns)).toBe(true)
    expect(
      canRead(
        player,
        { ...globalPrivate, ownerId: "u-player" },
        noCampaigns,
        noCampaigns
      )
    ).toBe(true)
    expect(canRead(player, globalPrivate, noCampaigns, noCampaigns)).toBe(false)
  })
})
