import type { FieldSpec } from "./registry"

/**
 * Turns flat `FormData` into the payload the schemas expect.
 *
 * Controlled widgets (tags, ordered lists, entity pickers) submit a JSON or id
 * string through a hidden input. Empty text becomes `null`; an empty list
 * becomes `[]`. Keys the form did not render are absent, so a partial update
 * leaves them untouched (#24).
 */
export function formToPayload(
  formData: FormData,
  specs: FieldSpec[]
): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  const metadata: Record<string, unknown> = {}
  let hasMetadata = false

  for (const spec of specs) {
    if (!formData.has(spec.name)) continue

    const raw = formData.get(spec.name)

    if (spec.name.startsWith("metadata.")) {
      const key = spec.name.slice("metadata.".length)
      const text = String(raw ?? "").trim()
      metadata[key] = text === "" ? null : text
      hasMetadata = true
      continue
    }

    switch (spec.widget) {
      case "checkbox":
        payload[spec.name] = raw === "on" || raw === "true"
        break

      case "number": {
        const text = String(raw ?? "").trim()
        payload[spec.name] = text === "" ? null : Number(text)
        break
      }

      case "tags":
      case "list": {
        const text = String(raw ?? "")
        try {
          payload[spec.name] = text === "" ? [] : JSON.parse(text)
        } catch {
          payload[spec.name] = []
        }
        break
      }

      case "entity": {
        const text = String(raw ?? "").trim()
        payload[spec.name] = text === "" ? null : text
        break
      }

      case "json": {
        const text = String(raw ?? "").trim()
        if (text === "") {
          payload[spec.name] = null
          break
        }
        try {
          payload[spec.name] = JSON.parse(text)
        } catch {
          payload[spec.name] = null
        }
        break
      }

      default: {
        const text = String(raw ?? "")
        payload[spec.name] = text.trim() === "" ? null : text
      }
    }
  }

  if (hasMetadata) payload.metadata = metadata

  return payload
}
