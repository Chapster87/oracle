import { beforeEach, describe, expect, it, vi } from "vitest"

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }))

vi.mock("../supabase", () => ({
  supabaseAdmin: { rpc },
}))

import { deleteEntity } from "./entities"

describe("deleteEntity", () => {
  beforeEach(() => {
    rpc.mockReset()
  })

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
