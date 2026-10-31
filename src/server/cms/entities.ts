import type { EntityType } from "@/types"
import { isEntityType } from "@/utils/entity"

import type { Session } from "../session"
import { supabaseAdmin } from "../supabase"

/**
 * Merges a partial `metadata` patch into an entity, key by key.
 *
 * Absent keys are untouched; a `null` value removes the key; keys already on
 * the row that the patch does not mention are preserved (#23).
 */
export async function updateEntityMetadata(
  type: EntityType,
  id: string,
  patch: Record<string, string | null>,
  viewer: Session
): Promise<void> {
  if (viewer.role !== "DM") {
    throw new Error("Only a DM may edit entity metadata")
  }
  if (!isEntityType(type)) {
    throw new Error(`Unknown entity type: ${type}`)
  }

  const { data, error } = await supabaseAdmin
    .from(type)
    .select("metadata")
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error(`No ${type} row with id ${id}`)

  const current = (data.metadata ?? {}) as Record<string, unknown>
  const next: Record<string, unknown> = { ...current }

  for (const [key, value] of Object.entries(patch)) {
    if (value === null) delete next[key]
    else next[key] = value
  }

  const { error: updateError } = await supabaseAdmin
    .from(type)
    .update({ metadata: next })
    .eq("id", id)

  if (updateError) throw updateError
}

/**
 * Deletes an entity and everything that points at it: relations, appearances,
 * the specialized row, and the `entities` registry row. The cleanup runs in one
 * transaction inside `public.delete_entity(uuid)`.
 */
export async function deleteEntity(
  type: EntityType,
  id: string,
  viewer: Session
): Promise<void> {
  if (viewer.role !== "DM") {
    throw new Error("Only a DM may delete an entity")
  }
  if (!isEntityType(type)) {
    throw new Error(`Unknown entity type: ${type}`)
  }

  const { error } = await supabaseAdmin.rpc("delete_entity", {
    p_entity_id: id,
  })

  if (error) throw error
}
