import { describe, expect, it } from "vitest"

import type { Entity, SecretSlot } from "@/types"

import {
  canSeeSlot,
  filterSlots,
  isMarkableColumn,
  isSecretSlotName,
  isValidSlotName,
  overlaySlots,
} from "./secrets"

const entity = {
  id: "e1",
  name: "Test Entity",
  alignment: null,
  owner_id: "owner-1",
  visibility: "private",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
} as unknown as Entity

function slot(overrides: Partial<SecretSlot> = {}): SecretSlot {
  return {
    id: "s1",
    entity_id: "e1",
    slot: "alignment",
    value: "Lawful Good",
    audience: "dm",
    revealed_at: null,
    position: 0,
    ...overrides,
  }
}

const dm = { isDM: true, userId: "dm-1", ownerId: "owner-1" }
const owner = { isDM: false, userId: "owner-1", ownerId: "owner-1" }
const stranger = { isDM: false, userId: "player-9", ownerId: "owner-1" }

describe("slot names", () => {
  it("recognises secret_N slots", () => {
    expect(isSecretSlotName("secret_1")).toBe(true)
    expect(isSecretSlotName("secret_")).toBe(false)
    expect(isSecretSlotName("secrets")).toBe(false)
  })

  it("treats real columns as markable but never identity or scope", () => {
    expect(isMarkableColumn(entity, "alignment")).toBe(true)
    expect(isMarkableColumn(entity, "name")).toBe(false)
    expect(isMarkableColumn(entity, "id")).toBe(false)
    expect(isMarkableColumn(entity, "owner_id")).toBe(false)
    expect(isMarkableColumn(entity, "visibility")).toBe(false)
    expect(isMarkableColumn(entity, "not_a_column")).toBe(false)
  })

  it("accepts either a markable column or a secret_N slot", () => {
    expect(isValidSlotName(entity, "alignment")).toBe(true)
    expect(isValidSlotName(entity, "secret_2")).toBe(true)
    expect(isValidSlotName(entity, "name")).toBe(false)
    expect(isValidSlotName(entity, "nonsense")).toBe(false)
  })
})

describe("audience filtering", () => {
  it("shows a DM every audience", () => {
    for (const audience of ["dm", "owner", "public"] as const) {
      expect(canSeeSlot(slot({ audience }), dm)).toBe(true)
    }
  })

  it("shows an owner owner and public slots, never dm", () => {
    expect(canSeeSlot(slot({ audience: "owner" }), owner)).toBe(true)
    expect(canSeeSlot(slot({ audience: "public" }), owner)).toBe(true)
    expect(canSeeSlot(slot({ audience: "dm" }), owner)).toBe(false)
  })

  it("shows a stranger public slots only", () => {
    expect(canSeeSlot(slot({ audience: "public" }), stranger)).toBe(true)
    expect(canSeeSlot(slot({ audience: "owner" }), stranger)).toBe(false)
    expect(canSeeSlot(slot({ audience: "dm" }), stranger)).toBe(false)
  })

  it("does not treat a null owner as an ownership match", () => {
    const orphan = { isDM: false, userId: "owner-1", ownerId: null }
    expect(canSeeSlot(slot({ audience: "owner" }), orphan)).toBe(false)
  })

  it("drops hidden slots entirely rather than masking them", () => {
    const slots = [
      slot({ id: "a", audience: "dm" }),
      slot({ id: "b", audience: "owner" }),
      slot({ id: "c", audience: "public" }),
    ]

    expect(filterSlots(slots, stranger).map((s) => s.id)).toEqual(["c"])
    expect(filterSlots(slots, owner).map((s) => s.id)).toEqual(["b", "c"])
    expect(filterSlots(slots, dm).map((s) => s.id)).toEqual(["a", "b", "c"])
  })
})

describe("overlay", () => {
  it("restores a column-named slot onto the entity", () => {
    const overlaid = overlaySlots(entity, [slot({ slot: "alignment" })])
    expect((overlaid as unknown as Record<string, unknown>).alignment).toBe(
      "Lawful Good"
    )
  })

  it("leaves secret_N slots off the entity shape", () => {
    const overlaid = overlaySlots(entity, [
      slot({ slot: "secret_1", value: "A true name" }),
    ])
    expect(overlaid).not.toHaveProperty("secret_1")
  })

  it("never overwrites identity or scope columns", () => {
    const overlaid = overlaySlots(entity, [
      slot({ slot: "name", value: "Impostor" }),
      slot({ slot: "visibility", value: "public" }),
    ])
    expect(overlaid.name).toBe("Test Entity")
    expect(overlaid.visibility).toBe("private")
  })
})
