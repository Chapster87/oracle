import { beforeEach, describe, expect, it, vi } from "vitest"

const { rpc, from } = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }))

vi.mock("../auth", () => ({
  createSupabaseServerClient: async () => ({ rpc, from }),
}))

import type { Viewer } from "../rbac"

import {
  createBatch,
  discardDraft,
  promoteDraft,
  proposeDraft,
  updateDraftPayload,
} from "./drafts"

const dm: Viewer = { userId: "u-dm", role: "DM" }
const player: Viewer = { userId: "u-player", role: "PLAYER" }

const BATCH_ID = "00000000-0000-4000-8000-000000000001"
const DRAFT_ID = "00000000-0000-4000-8000-000000000002"

/** A chainable stand-in for the Supabase query builder. */
function chain(result: { data?: unknown; error?: unknown } = {}) {
  const c: Record<string, unknown> = {}
  c.select = vi.fn(() => c)
  c.eq = vi.fn(() => c)
  c.order = vi.fn(() => c)
  c.maybeSingle = vi.fn(async () => ({
    data: result.data ?? null,
    error: result.error ?? null,
  }))
  c.insert = vi.fn(() => c)
  c.update = vi.fn(() => c)
  c.error = result.error ?? null
  return c
}

beforeEach(() => {
  rpc.mockReset()
  from.mockReset()
})

describe("proposeDraft", () => {
  it("rejects a player without touching the database", async () => {
    const result = await proposeDraft(
      {
        kind: "create",
        model: "characters",
        campaignId: null,
        payload: { name: "Gideon" },
        batchId: BATCH_ID,
      },
      player
    )

    expect(result).toMatchObject({ ok: false, code: "forbidden" })
    expect(from).not.toHaveBeenCalled()
  })

  it("rejects an invalid payload before writing", async () => {
    const result = await proposeDraft(
      {
        kind: "create",
        model: "characters",
        campaignId: null,
        payload: { species: "Elf" },
        batchId: BATCH_ID,
      },
      dm
    )

    expect(result).toMatchObject({ ok: false, code: "validation" })
    expect(result.ok === false && result.fieldErrors?.name).toBeDefined()
    expect(from).not.toHaveBeenCalled()
  })

  it("inserts a new draft for a global DM", async () => {
    from.mockReturnValue(chain())

    const result = await proposeDraft(
      {
        kind: "create",
        model: "characters",
        campaignId: null,
        payload: { name: "Gideon" },
        batchId: BATCH_ID,
        lane: "forge-npc",
      },
      dm
    )

    expect(result.ok).toBe(true)
    expect(from).toHaveBeenCalledWith("drafts")
  })

  it("overwrites an untouched draft in place", async () => {
    from.mockReturnValue(
      chain({ data: { id: DRAFT_ID, status: "pending", dm_edited_at: null } })
    )

    const result = await proposeDraft(
      {
        kind: "create",
        model: "characters",
        campaignId: null,
        payload: { name: "Gideon" },
        batchId: BATCH_ID,
        supersedes: DRAFT_ID,
      },
      dm
    )

    expect(result).toMatchObject({ ok: true, id: DRAFT_ID })
  })

  it("forks a DM-edited draft", async () => {
    from.mockReturnValue(
      chain({
        data: {
          id: DRAFT_ID,
          status: "pending",
          dm_edited_at: "2026-01-01T00:00:00Z",
        },
      })
    )

    const result = await proposeDraft(
      {
        kind: "create",
        model: "characters",
        campaignId: null,
        payload: { name: "Gideon" },
        batchId: BATCH_ID,
        supersedes: DRAFT_ID,
      },
      dm
    )

    expect(result.ok).toBe(true)
    expect(result.ok && result.id).not.toBe(DRAFT_ID)
  })
})

describe("updateDraftPayload", () => {
  it("marks the draft as DM-edited", async () => {
    const c = chain({
      data: {
        id: DRAFT_ID,
        status: "pending",
        campaign_id: null,
        model: "characters",
        kind: "create",
      },
    })
    from.mockReturnValue(c)

    const result = await updateDraftPayload(
      DRAFT_ID,
      { name: "Gideon" },
      [],
      dm
    )

    expect(result).toMatchObject({ ok: true, id: DRAFT_ID })
    expect(c.update).toHaveBeenCalledWith(
      expect.objectContaining({ dm_edited_at: expect.any(String) })
    )
  })
})

describe("discardDraft", () => {
  it("sets the draft discarded", async () => {
    const c = chain({
      data: { id: DRAFT_ID, status: "pending", campaign_id: null },
    })
    from.mockReturnValue(c)

    const result = await discardDraft(DRAFT_ID, "not wanted", dm)

    expect(result).toMatchObject({ ok: true, id: DRAFT_ID })
    expect(c.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "discarded", reason: "not wanted" })
    )
  })
})

describe("promoteDraft", () => {
  it("returns the promoted entity id", async () => {
    rpc.mockResolvedValue({ data: "entity-1", error: null })

    const result = await promoteDraft(DRAFT_ID)

    expect(result).toMatchObject({ ok: true, id: "entity-1" })
    expect(rpc).toHaveBeenCalledWith("promote_draft", { p_draft_id: DRAFT_ID })
  })

  it("maps a missing dependency to a dependency error", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: {
        code: "PT422",
        message: "Promote the referenced entity first: Gideon",
      },
    })

    const result = await promoteDraft(DRAFT_ID)

    expect(result).toMatchObject({ ok: false, code: "dependency" })
  })

  it("maps a stale base token to a conflict", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { code: "PT409", message: "stale" },
    })

    const result = await promoteDraft(DRAFT_ID)

    expect(result).toMatchObject({ ok: false, code: "conflict" })
  })
})

describe("createBatch", () => {
  it("creates a batch for a global DM", async () => {
    from.mockReturnValue(chain())

    const result = await createBatch(null, dm)

    expect(result.ok).toBe(true)
    expect(from).toHaveBeenCalledWith("draft_batches")
  })

  it("rejects a player", async () => {
    const result = await createBatch(null, player)

    expect(result).toMatchObject({ ok: false, code: "forbidden" })
    expect(from).not.toHaveBeenCalled()
  })
})
