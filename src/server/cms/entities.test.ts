import { beforeEach, describe, expect, it, vi } from "vitest"

const { rpc, from } = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }))

vi.mock("../auth", () => ({
  createSupabaseServerClient: async () => ({ rpc, from }),
}))

import type { Viewer } from "../rbac"

import {
  createEntity,
  deleteEntity,
  updateEntity,
  updateEntityMetadata,
} from "./entities"

const dm: Viewer = { userId: "u-dm", role: "DM" }
const player: Viewer = { userId: "u-player", role: "PLAYER" }

/** A chainable stand-in for `.select(...).eq(...).maybeSingle()`. */
function selectChain(result: { data: unknown; error: unknown }) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    maybeSingle: async () => result,
  }
  return chain
}

beforeEach(() => {
  rpc.mockReset()
  from.mockReset()
})

describe("createEntity", () => {
  it("rejects a player without touching the database", async () => {
    const result = await createEntity("characters", { name: "Gideon" }, player)

    expect(result).toMatchObject({ ok: false, code: "forbidden" })
    expect(rpc).not.toHaveBeenCalled()
  })

  it("rejects an invalid payload before writing", async () => {
    const result = await createEntity("characters", { species: "Elf" }, dm)

    expect(result).toMatchObject({ ok: false, code: "validation" })
    expect(result.ok === false && result.fieldErrors?.name).toBeDefined()
    expect(rpc).not.toHaveBeenCalled()
  })

  it("writes a global entity for a DM and assigns the actor as owner", async () => {
    rpc.mockResolvedValue({ error: null })

    const result = await createEntity("characters", { name: "Gideon" }, dm)

    expect(result.ok).toBe(true)
    expect(rpc).toHaveBeenCalledWith(
      "write_entity",
      expect.objectContaining({
        p_model: "characters",
        p_actor: "u-dm",
        p_base_updated_at: null,
        p_payload: expect.objectContaining({
          name: "Gideon",
          owner_id: "u-dm",
        }),
      })
    )
  })

  it("surfaces a unique violation as a name field error", async () => {
    rpc.mockResolvedValue({ error: { code: "23505", message: "duplicate" } })

    const result = await createEntity("characters", { name: "Gideon" }, dm)

    expect(result).toMatchObject({ ok: false, code: "constraint" })
    expect(result.ok === false && result.fieldErrors?.name).toBeDefined()
  })
})

describe("updateEntity", () => {
  it("returns not_found when the row is gone", async () => {
    from.mockReturnValue(selectChain({ data: null, error: null }))

    const result = await updateEntity(
      "characters",
      "abc",
      { name: "X" },
      null,
      dm
    )

    expect(result).toMatchObject({ ok: false, code: "not_found" })
    expect(rpc).not.toHaveBeenCalled()
  })

  it("forbids a DM who does not run the entity's campaign", async () => {
    from.mockImplementation((table: string) => {
      if (table === "characters") {
        return selectChain({
          data: {
            id: "abc",
            campaign_id: "c1",
            owner_id: "u-other",
            visibility: "private",
            updated_at: "2026-01-01T00:00:00Z",
          },
          error: null,
        })
      }
      if (table === "campaigns") {
        return selectChain({ data: { owner_id: "u-other" }, error: null })
      }
      return selectChain({ data: null, error: null })
    })

    const result = await updateEntity(
      "characters",
      "abc",
      { name: "X" },
      null,
      dm
    )

    expect(result).toMatchObject({ ok: false, code: "forbidden" })
    expect(rpc).not.toHaveBeenCalled()
  })

  it("writes when the viewer runs the campaign", async () => {
    from.mockImplementation((table: string) => {
      if (table === "characters") {
        return selectChain({
          data: {
            id: "abc",
            campaign_id: "c1",
            owner_id: "u-dm",
            visibility: "private",
            updated_at: "2026-01-01T00:00:00Z",
          },
          error: null,
        })
      }
      if (table === "campaigns") {
        return selectChain({ data: { owner_id: "u-dm" }, error: null })
      }
      return selectChain({ data: null, error: null })
    })
    rpc.mockResolvedValue({ error: null })

    const result = await updateEntity(
      "characters",
      "abc",
      { alignment: "Lawful Good" },
      "2026-01-01T00:00:00Z",
      dm
    )

    expect(result).toMatchObject({ ok: true, id: "abc" })
    expect(rpc).toHaveBeenCalledWith(
      "write_entity",
      expect.objectContaining({
        p_id: "abc",
        p_base_updated_at: "2026-01-01T00:00:00Z",
      })
    )
  })

  it("maps PT409 to a conflict", async () => {
    from.mockImplementation((table: string) => {
      if (table === "characters") {
        return selectChain({
          data: {
            id: "abc",
            campaign_id: null,
            owner_id: "u-dm",
            visibility: "private",
            updated_at: "2026-01-01T00:00:00Z",
          },
          error: null,
        })
      }
      return selectChain({ data: null, error: null })
    })
    rpc.mockResolvedValue({ error: { code: "PT409", message: "stale" } })

    const result = await updateEntity(
      "characters",
      "abc",
      { name: "X" },
      "old",
      dm
    )

    expect(result).toMatchObject({ ok: false, code: "conflict" })
  })
})

describe("updateEntityMetadata", () => {
  function metadataChain(metadata: Record<string, unknown> | null) {
    const chain: Record<string, unknown> = {}
    chain.select = vi.fn(() => chain)
    chain.eq = vi.fn(() => chain)
    chain.maybeSingle = vi.fn(async () => ({
      data: metadata ? { metadata } : null,
      error: null,
    }))
    chain.update = vi.fn(() => chain)
    return chain
  }

  it("leaves absent keys untouched and preserves unlisted ones", async () => {
    const chain = metadataChain({ ddb_url: "https://www.dndbeyond.com/x" })
    from.mockReturnValue(chain)

    await updateEntityMetadata("players", "abc", { dm_notes: "secret" }, dm)

    expect(chain.update).toHaveBeenCalledWith({
      metadata: {
        ddb_url: "https://www.dndbeyond.com/x",
        dm_notes: "secret",
      },
    })
  })

  it("removes a key when the patch value is null", async () => {
    const chain = metadataChain({ ddb_url: "x", dm_notes: "y" })
    from.mockReturnValue(chain)

    await updateEntityMetadata("players", "abc", { ddb_url: null }, dm)

    expect(chain.update).toHaveBeenCalledWith({ metadata: { dm_notes: "y" } })
  })

  it("rejects a player without touching the database", async () => {
    await expect(
      updateEntityMetadata("players", "abc", { dm_notes: "x" }, player)
    ).rejects.toThrow(/Only a DM/)
    expect(from).not.toHaveBeenCalled()
  })
})

describe("deleteEntity", () => {
  it("rejects a player without touching the database", async () => {
    await expect(
      deleteEntity("players", "abc", { role: "PLAYER", userId: "u" })
    ).rejects.toThrow(/Only a DM/)
    expect(rpc).not.toHaveBeenCalled()
  })

  it("rejects an unknown entity type", async () => {
    await expect(
      deleteEntity("dragons" as never, "abc", { role: "DM", userId: "u" })
    ).rejects.toThrow(/Unknown entity type/)
    expect(rpc).not.toHaveBeenCalled()
  })

  it("calls delete_entity for a DM", async () => {
    rpc.mockResolvedValue({ error: null })

    await deleteEntity("players", "abc", { role: "DM", userId: "u" })

    expect(rpc).toHaveBeenCalledWith("delete_entity", { p_entity_id: "abc" })
  })

  it("surfaces a database error", async () => {
    rpc.mockResolvedValue({ error: new Error("boom") })

    await expect(
      deleteEntity("players", "abc", { role: "DM", userId: "u" })
    ).rejects.toThrow("boom")
  })
})
