import { describe, expect, it } from "vitest"

import type { Draft, Entity, SecretSlot } from "@/types"

import { projectDraft, projectEntity } from "./entity-view"

const entity = {
  id: "e1",
  name: "Gideon",
  alignment: null,
  secrets: "DM only",
  owner_id: "owner-1",
  visibility: "private",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
} as unknown as Entity

function slot(overrides: Partial<SecretSlot> = {}): SecretSlot {
  return {
    id: "s1",
    entity_id: "e1",
    slot: "secret_1",
    source_column: null,
    value: "Lawful Good",
    audience: "dm",
    revealed_at: null,
    position: 0,
    ...overrides,
  }
}

function draft(overrides: Partial<Draft> = {}): Draft {
  return {
    id: "d1",
    kind: "create",
    model: "characters",
    target_id: "e1",
    campaign_id: null,
    payload: { name: "Gideon", alignment: "Lawful Good" },
    slot_ops: [],
    base_updated_at: null,
    status: "pending",
    reason: null,
    lane: "forge-npc",
    created_by: "dm-1",
    decided_by: null,
    decided_at: null,
    dm_edited_at: null,
    supersedes_id: null,
    batch_id: "b1",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

const dm = { isDM: true, userId: "dm-1", ownerId: "owner-1" }
const owner = { isDM: false, userId: "owner-1", ownerId: "owner-1" }
const stranger = { isDM: false, userId: "player-9", ownerId: "owner-1" }

const record = (value: Entity) => value as unknown as Record<string, unknown>

describe("projectEntity", () => {
  it("gives a DM every slot and the full row", () => {
    const { entity: projected, slots } = projectEntity(
      "characters",
      entity,
      [slot({ source_column: "alignment" })],
      dm
    )

    expect(slots).toHaveLength(1)
    expect(record(projected).alignment).toBe("Lawful Good")
    expect(record(projected).secrets).toBe("DM only")
  })

  it("strips the secret field and hides DM slots from a player", () => {
    const { entity: projected, slots } = projectEntity(
      "characters",
      entity,
      [slot({ source_column: "alignment", audience: "dm" })],
      stranger
    )

    expect(slots).toHaveLength(0)
    expect(projected).not.toHaveProperty("secrets")
    expect(record(projected).alignment).toBeNull()
  })

  it("restores an owner slot onto its source column for the owner", () => {
    const { entity: projected, slots } = projectEntity(
      "characters",
      entity,
      [slot({ source_column: "alignment", audience: "owner" })],
      owner
    )

    expect(slots).toHaveLength(1)
    expect(record(projected).alignment).toBe("Lawful Good")
  })

  it("leaves a free-standing secret off the entity shape", () => {
    const { entity: projected } = projectEntity(
      "characters",
      entity,
      [slot({ slot: "secret_2", source_column: null, audience: "public" })],
      stranger
    )

    expect(projected).not.toHaveProperty("secret_2")
  })
})

describe("projectDraft", () => {
  it("hides a marked column from a player and shows it to the DM", () => {
    const marked = draft({
      slot_ops: [
        {
          op: "upsert",
          slot: "secret_1",
          source_column: "alignment",
          value: "Lawful Good",
          audience: "dm",
        },
      ],
    })

    const dmView = projectDraft(marked, {
      isDM: true,
      userId: "dm-1",
      ownerId: "dm-1",
    })
    expect(record(dmView.entity).alignment).toBe("Lawful Good")
    expect(dmView.slots).toHaveLength(1)

    const playerView = projectDraft(marked, {
      isDM: false,
      userId: "player-9",
      ownerId: "dm-1",
    })
    expect(record(playerView.entity).alignment).toBeNull()
    expect(playerView.slots).toHaveLength(0)
  })

  it("shows an owner-audience slot to the owner and hides it from others", () => {
    const raised = draft({
      slot_ops: [
        {
          op: "upsert",
          slot: "secret_1",
          source_column: "alignment",
          value: "Lawful Good",
          audience: "owner",
        },
      ],
    })

    const ownerView = projectDraft(raised, {
      isDM: false,
      userId: "dm-1",
      ownerId: "dm-1",
    })
    expect(record(ownerView.entity).alignment).toBe("Lawful Good")

    const otherView = projectDraft(raised, {
      isDM: false,
      userId: "player-9",
      ownerId: "dm-1",
    })
    expect(record(otherView.entity).alignment).toBeNull()
  })

  it("keeps a free-standing secret off the entity shape", () => {
    const freeStanding = draft({
      payload: { name: "Gideon" },
      slot_ops: [
        { op: "upsert", slot: "secret_1", value: "Hidden", audience: "public" },
      ],
    })

    const view = projectDraft(freeStanding, {
      isDM: false,
      userId: "player-9",
      ownerId: "dm-1",
    })

    expect(view.entity).not.toHaveProperty("secret_1")
    expect(view.slots).toHaveLength(1)
  })

  it("ignores delete ops when building the preview", () => {
    const view = projectDraft(
      draft({ slot_ops: [{ op: "delete", slot: "secret_1" }] }),
      { isDM: true, userId: "dm-1", ownerId: "dm-1" }
    )

    expect(view.slots).toHaveLength(0)
  })
})
