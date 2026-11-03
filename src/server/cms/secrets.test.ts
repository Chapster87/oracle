import { beforeEach, describe, expect, it, vi } from "vitest"

const { from } = vi.hoisted(() => ({ from: vi.fn() }))
const { canWriteEntity } = vi.hoisted(() => ({ canWriteEntity: vi.fn() }))

vi.mock("../auth", () => ({
  createSupabaseServerClient: async () => ({ from }),
}))
vi.mock("./entities", () => ({ canWriteEntity }))

import type { Viewer } from "../rbac"

import {
  createSlot,
  deleteSlot,
  markField,
  setAudience,
  unmarkField,
} from "./secrets"

const dm: Viewer = { userId: "u-dm", role: "DM" }

function makeChain(data: unknown) {
  const chain: Record<string, unknown> = {}
  chain.select = vi.fn(() => chain)
  chain.eq = vi.fn(() => chain)
  chain.order = vi.fn(() => chain)
  chain.maybeSingle = vi.fn(async () => ({ data, error: null }))
  chain.upsert = vi.fn(async () => ({ error: null }))
  chain.update = vi.fn(() => chain)
  chain.delete = vi.fn(() => chain)
  return chain
}

beforeEach(() => {
  from.mockReset()
  canWriteEntity.mockReset()
})

describe("markField", () => {
  it("refuses when the viewer cannot write the entity", async () => {
    canWriteEntity.mockResolvedValue(false)

    const result = await markField("characters", "e1", "alignment", dm)

    expect(result).toMatchObject({ ok: false, code: "forbidden" })
    expect(from).not.toHaveBeenCalled()
  })

  it("refuses a column that is not markable", async () => {
    canWriteEntity.mockResolvedValue(true)
    from.mockReturnValue(makeChain({ id: "e1", name: "Gideon" }))

    const result = await markField("characters", "e1", "name", dm)

    expect(result).toMatchObject({ ok: false, code: "validation" })
  })

  it("moves the value into the next numbered secret and nulls the column", async () => {
    canWriteEntity.mockResolvedValue(true)

    const entityChain = makeChain({ id: "e1", alignment: "Lawful Good" })
    const slotChain = makeChain(null)

    from.mockImplementation((table: string) =>
      table === "entity_secret_slots" ? slotChain : entityChain
    )

    const result = await markField("characters", "e1", "alignment", dm)

    expect(result).toMatchObject({ ok: true })
    expect(slotChain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        entity_id: "e1",
        slot: "secret_1",
        source_column: "alignment",
        value: "Lawful Good",
        audience: "dm",
      }),
      { onConflict: "entity_id,slot" }
    )
    expect(entityChain.update).toHaveBeenCalledWith({ alignment: null })
  })
})

describe("unmarkField", () => {
  it("copies the value back and removes the slot", async () => {
    canWriteEntity.mockResolvedValue(true)

    const entityChain = makeChain(null)
    const slotChain = makeChain({ id: "s1", value: "Lawful Good" })

    from.mockImplementation((table: string) =>
      table === "entity_secret_slots" ? slotChain : entityChain
    )

    const result = await unmarkField("characters", "e1", "alignment", dm)

    expect(result).toMatchObject({ ok: true })
    expect(entityChain.update).toHaveBeenCalledWith({
      alignment: "Lawful Good",
    })
    expect(slotChain.delete).toHaveBeenCalled()
  })

  it("returns not_found when the field is not marked", async () => {
    canWriteEntity.mockResolvedValue(true)
    from.mockReturnValue(makeChain(null))

    const result = await unmarkField("characters", "e1", "alignment", dm)

    expect(result).toMatchObject({ ok: false, code: "not_found" })
  })
})

describe("setAudience", () => {
  it("stamps revealed_at when raising above dm", async () => {
    canWriteEntity.mockResolvedValue(true)
    const chain = makeChain(null)
    from.mockReturnValue(chain)

    await setAudience("characters", "e1", "secret_1", "public", dm)

    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        audience: "public",
        revealed_at: expect.any(String),
      })
    )
  })

  it("clears revealed_at when returning to dm", async () => {
    canWriteEntity.mockResolvedValue(true)
    const chain = makeChain(null)
    from.mockReturnValue(chain)

    await setAudience("characters", "e1", "secret_1", "dm", dm)

    expect(chain.update).toHaveBeenCalledWith({
      audience: "dm",
      revealed_at: null,
    })
  })

  it("rejects an unknown audience", async () => {
    canWriteEntity.mockResolvedValue(true)

    const result = await setAudience(
      "characters",
      "e1",
      "secret_1",
      "everyone" as never,
      dm
    )

    expect(result).toMatchObject({ ok: false, code: "validation" })
  })
})

describe("slots", () => {
  it("creates a free-standing secret at audience dm", async () => {
    canWriteEntity.mockResolvedValue(true)
    const chain = makeChain(null)
    from.mockReturnValue(chain)

    await createSlot("characters", "e1", "secret_1", "A true name", dm)

    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        slot: "secret_1",
        source_column: null,
        value: "A true name",
        audience: "dm",
        revealed_at: null,
      }),
      { onConflict: "entity_id,slot" }
    )
  })

  it("refuses to create a slot that is not numbered", async () => {
    canWriteEntity.mockResolvedValue(true)

    const result = await createSlot("characters", "e1", "alignment", "x", dm)

    expect(result).toMatchObject({ ok: false, code: "validation" })
  })

  it("refuses to delete a marked field's secret", async () => {
    canWriteEntity.mockResolvedValue(true)
    from.mockReturnValue(makeChain({ id: "s1", source_column: "alignment" }))

    const result = await deleteSlot("characters", "e1", "secret_1", dm)

    expect(result).toMatchObject({ ok: false, code: "validation" })
  })

  it("deletes a free-standing secret", async () => {
    canWriteEntity.mockResolvedValue(true)
    const chain = makeChain({ id: "s1", source_column: null })
    from.mockReturnValue(chain)

    const result = await deleteSlot("characters", "e1", "secret_1", dm)

    expect(result).toMatchObject({ ok: true })
    expect(chain.delete).toHaveBeenCalled()
  })
})
