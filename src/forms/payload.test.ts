import { describe, expect, it } from "vitest"

import { formToPayload } from "./payload"
import type { FieldSpec } from "./registry"

function formData(entries: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(entries)) data.set(key, value)
  return data
}

const specs: FieldSpec[] = [
  { name: "name", label: "Name", widget: "text" },
  { name: "level", label: "Level", widget: "number" },
  { name: "is_deceased", label: "Deceased", widget: "checkbox" },
  { name: "tags", label: "Tags", widget: "tags" },
  { name: "points_of_interest", label: "POI", widget: "list" },
  { name: "campaign_id", label: "Campaign", widget: "entity" },
  { name: "metadata.ddb_url", label: "DDB", widget: "text" },
]

describe("formToPayload", () => {
  it("keeps text and maps empty text to null", () => {
    const payload = formToPayload(
      formData({ name: "Gideon", level: "" }),
      specs
    )

    expect(payload.name).toBe("Gideon")
    expect(payload.level).toBeNull()
  })

  it("maps a checkbox to a boolean and omits it when unchecked", () => {
    expect(
      formToPayload(formData({ is_deceased: "on" }), specs).is_deceased
    ).toBe(true)
    expect(formToPayload(formData({}), specs)).not.toHaveProperty(
      "is_deceased"
    )
  })

  it("parses JSON lists and falls back to an empty array", () => {
    expect(
      formToPayload(formData({ tags: '["orc","undead"]' }), specs).tags
    ).toEqual(["orc", "undead"])
    expect(formToPayload(formData({ tags: "not json" }), specs).tags).toEqual([])
  })

  it("maps an empty entity picker to null", () => {
    expect(
      formToPayload(formData({ campaign_id: "" }), specs).campaign_id
    ).toBeNull()
    expect(
      formToPayload(formData({ campaign_id: "c1" }), specs).campaign_id
    ).toBe("c1")
  })

  it("nests metadata keys and clears empty ones", () => {
    const payload = formToPayload(
      formData({ "metadata.ddb_url": "https://www.dndbeyond.com/x" }),
      specs
    )
    expect(payload.metadata).toEqual({
      ddb_url: "https://www.dndbeyond.com/x",
    })

    const cleared = formToPayload(formData({ "metadata.ddb_url": "" }), specs)
    expect(cleared.metadata).toEqual({ ddb_url: null })
  })

  it("omits keys the form did not render", () => {
    const payload = formToPayload(formData({ name: "Gideon" }), specs)

    expect(payload).not.toHaveProperty("tags")
    expect(payload).not.toHaveProperty("metadata")
  })
})
