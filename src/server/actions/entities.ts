"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { allowedFields, fieldSpecsFor } from "@/forms/registry"
import { formToPayload } from "@/forms/payload"
import { ddbUrlSchema } from "@/schemas/metadata"
import {
  createEntity,
  deleteEntity,
  updateEntity,
  updateEntityMetadata,
} from "@/server/cms/entities"
import { requireDmViewer } from "@/server/auth"
import type { WriteResult } from "@/types"
import { isEntityType } from "@/utils/entity"

export interface ActionResult {
  ok: boolean
  fieldErrors?: Record<string, string>
  formError?: string
}

/**
 * Sets or clears `metadata.ddb_url` on an entity. The first write path in the
 * app: it proves session → RBAC → DAL → DB → revalidate end to end (#26).
 *
 * `intent=remove` clears the key; anything else validates and saves the URL.
 */
export async function connectDndBeyondAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const viewer = await requireDmViewer()

  const type = String(formData.get("type") ?? "")
  const id = String(formData.get("id") ?? "")
  const intent = String(formData.get("intent") ?? "save")

  if (!isEntityType(type)) {
    return { ok: false, formError: "Unknown entity type." }
  }

  if (intent === "remove") {
    try {
      await updateEntityMetadata(type, id, { ddb_url: null }, viewer)
    } catch (error) {
      return {
        ok: false,
        formError:
          error instanceof Error ? error.message : "Could not remove the link.",
      }
    }

    revalidatePath(`/${type}/${id}`)
    return { ok: true }
  }

  const raw = String(formData.get("ddb_url") ?? "").trim()
  const parsed = ddbUrlSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: {
        ddb_url: parsed.error.issues[0]?.message ?? "Enter a valid URL.",
      },
    }
  }

  try {
    await updateEntityMetadata(type, id, { ddb_url: parsed.data }, viewer)
  } catch (error) {
    return {
      ok: false,
      formError:
        error instanceof Error ? error.message : "Could not save the link.",
    }
  }

  revalidatePath(`/${type}/${id}`)
  return { ok: true }
}

/**
 * Creates an entity from the shared form, then lands on its detail page.
 */
export async function createEntityAction(
  _prev: WriteResult | null,
  formData: FormData
): Promise<WriteResult> {
  const viewer = await requireDmViewer()

  const type = String(formData.get("type") ?? "")
  if (!isEntityType(type)) {
    return { ok: false, code: "validation", formError: "Unknown entity type." }
  }

  const specs = allowedFields(fieldSpecsFor(type), viewer)
  const payload = formToPayload(formData, specs)

  const result = await createEntity(type, payload, viewer)
  if (!result.ok) return result

  revalidatePath(`/${type}`)
  redirect(`/${type}/${result.id}`)
}

/**
 * Updates an entity from the shared form. The form carries the row's
 * `updated_at` so a concurrent edit is rejected rather than overwritten.
 */
export async function updateEntityAction(
  _prev: WriteResult | null,
  formData: FormData
): Promise<WriteResult> {
  const viewer = await requireDmViewer()

  const type = String(formData.get("type") ?? "")
  const id = String(formData.get("id") ?? "")

  if (!isEntityType(type)) {
    return { ok: false, code: "validation", formError: "Unknown entity type." }
  }

  const baseUpdatedAt = String(formData.get("base_updated_at") ?? "") || null
  const specs = allowedFields(fieldSpecsFor(type), viewer)
  const payload = formToPayload(formData, specs)

  const result = await updateEntity(type, id, payload, baseUpdatedAt, viewer)
  if (!result.ok) return result

  revalidatePath(`/${type}/${id}`)
  revalidatePath(`/${type}`)
  redirect(`/${type}/${id}`)
}

/**
 * Deletes an entity and its relations, then returns to the directory.
 */
export async function deleteEntityAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const viewer = await requireDmViewer()

  const type = String(formData.get("type") ?? "")
  const id = String(formData.get("id") ?? "")

  if (!isEntityType(type)) {
    return { ok: false, formError: "Unknown entity type." }
  }

  try {
    await deleteEntity(type, id, viewer)
  } catch (error) {
    return {
      ok: false,
      formError:
        error instanceof Error ? error.message : "Could not delete the entity.",
    }
  }

  revalidatePath(`/${type}`)
  redirect(`/${type}`)
}
