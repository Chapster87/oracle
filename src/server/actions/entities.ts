"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { ddbUrlSchema } from "@/schemas/metadata"
import { deleteEntity, updateEntityMetadata } from "@/server/cms/entities"
import { requireDmSession } from "@/server/session"
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
  const viewer = requireDmSession()

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
 * Deletes an entity and its relations, then returns to the directory.
 */
export async function deleteEntityAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const viewer = requireDmSession()

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
