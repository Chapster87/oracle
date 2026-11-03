import type { Entity, EntityType, SecretAudience, WriteResult } from "@/types"
import { isEntityType } from "@/utils/entity"
import {
  isMarkableColumn,
  isSecretSlotName,
  nextSecretSlotName,
} from "@/utils/secrets"

import { createSupabaseServerClient } from "../auth"
import type { Viewer } from "../rbac"
import { loadSlots } from "../secrets"
import { canWriteEntity } from "./entities"

const AUDIENCES: SecretAudience[] = ["dm", "owner", "public"]

/** Shared gate: the entity must exist and the viewer must be able to write it. */
async function authorize(
  type: EntityType,
  entityId: string,
  viewer: Viewer
): Promise<WriteResult | null> {
  if (!isEntityType(type)) {
    return { ok: false, code: "validation", formError: "Unknown entity type." }
  }

  if (!(await canWriteEntity(type, entityId, viewer))) {
    return {
      ok: false,
      code: "forbidden",
      formError: "You cannot edit that entity.",
    }
  }

  return null
}

/**
 * Moves a column's value into the next numbered secret and nulls the column.
 * The slot records `source_column`, which is how unmarking finds it again.
 *
 * The slot is written before the column is cleared, so a failure leaves the
 * value in both places rather than losing it.
 */
export async function markField(
  type: EntityType,
  entityId: string,
  column: string,
  viewer: Viewer
): Promise<WriteResult> {
  const denied = await authorize(type, entityId, viewer)
  if (denied) return denied

  const db = await createSupabaseServerClient()

  const { data: row, error } = await db
    .from(type)
    .select("*")
    .eq("id", entityId)
    .maybeSingle()

  if (error) throw error
  if (!row) {
    return {
      ok: false,
      code: "not_found",
      formError: "That entity no longer exists.",
    }
  }

  if (!isMarkableColumn(row as Entity, column)) {
    return {
      ok: false,
      code: "validation",
      formError: "That field cannot be marked secret.",
    }
  }

  const slots = await loadSlots(entityId)

  // Marking an already-marked field is a no-op rather than a second slot.
  if (slots.some((slot) => slot.source_column === column)) {
    return { ok: true, id: entityId }
  }

  const value = (row as Record<string, unknown>)[column] ?? null

  const { error: slotError } = await db.from("entity_secret_slots").upsert(
    {
      entity_id: entityId,
      slot: nextSecretSlotName(slots),
      source_column: column,
      value,
      audience: "dm",
      revealed_at: null,
    },
    { onConflict: "entity_id,slot" }
  )

  if (slotError) throw slotError

  const { error: clearError } = await db
    .from(type)
    .update({ [column]: null })
    .eq("id", entityId)

  if (clearError) throw clearError

  return { ok: true, id: entityId }
}

/**
 * Copies a marked secret's value back onto its column and removes the slot. The
 * column is written before the slot is deleted, for the same fail-safe reason.
 */
export async function unmarkField(
  type: EntityType,
  entityId: string,
  column: string,
  viewer: Viewer
): Promise<WriteResult> {
  const denied = await authorize(type, entityId, viewer)
  if (denied) return denied

  const db = await createSupabaseServerClient()

  const { data: slot, error } = await db
    .from("entity_secret_slots")
    .select("id, value")
    .eq("entity_id", entityId)
    .eq("source_column", column)
    .maybeSingle()

  if (error) throw error
  if (!slot) {
    return {
      ok: false,
      code: "not_found",
      formError: "That field is not marked secret.",
    }
  }

  const { error: writeError } = await db
    .from(type)
    .update({ [column]: slot.value })
    .eq("id", entityId)

  if (writeError) throw writeError

  const { error: deleteError } = await db
    .from("entity_secret_slots")
    .delete()
    .eq("id", slot.id)

  if (deleteError) throw deleteError

  return { ok: true, id: entityId }
}

/** Creates a free-standing numbered secret at audience `dm`. */
export async function createSlot(
  type: EntityType,
  entityId: string,
  slotName: string,
  value: unknown,
  viewer: Viewer
): Promise<WriteResult> {
  const denied = await authorize(type, entityId, viewer)
  if (denied) return denied

  if (!isSecretSlotName(slotName)) {
    return {
      ok: false,
      code: "validation",
      formError: "Secrets are named secret_N.",
    }
  }

  const db = await createSupabaseServerClient()

  const { error } = await db.from("entity_secret_slots").upsert(
    {
      entity_id: entityId,
      slot: slotName,
      source_column: null,
      value,
      audience: "dm",
      revealed_at: null,
    },
    { onConflict: "entity_id,slot" }
  )

  if (error) throw error
  return { ok: true, id: entityId }
}

/** Replaces a secret's content, leaving its audience alone. */
export async function updateSlotValue(
  type: EntityType,
  entityId: string,
  slotName: string,
  value: unknown,
  viewer: Viewer
): Promise<WriteResult> {
  const denied = await authorize(type, entityId, viewer)
  if (denied) return denied

  const db = await createSupabaseServerClient()

  const { error } = await db
    .from("entity_secret_slots")
    .update({ value })
    .eq("entity_id", entityId)
    .eq("slot", slotName)

  if (error) throw error
  return { ok: true, id: entityId }
}

/**
 * Raises or lowers a secret's audience. Raising above `dm` stamps
 * `revealed_at`; returning to `dm` clears it.
 */
export async function setAudience(
  type: EntityType,
  entityId: string,
  slotName: string,
  audience: SecretAudience,
  viewer: Viewer
): Promise<WriteResult> {
  const denied = await authorize(type, entityId, viewer)
  if (denied) return denied

  if (!AUDIENCES.includes(audience)) {
    return { ok: false, code: "validation", formError: "Unknown audience." }
  }

  const db = await createSupabaseServerClient()

  const { error } = await db
    .from("entity_secret_slots")
    .update({
      audience,
      revealed_at: audience === "dm" ? null : new Date().toISOString(),
    })
    .eq("entity_id", entityId)
    .eq("slot", slotName)

  if (error) throw error
  return { ok: true, id: entityId }
}

/**
 * Removes a free-standing secret. A marked field's secret must be unmarked
 * instead, so its value is copied back rather than dropped.
 */
export async function deleteSlot(
  type: EntityType,
  entityId: string,
  slotName: string,
  viewer: Viewer
): Promise<WriteResult> {
  const denied = await authorize(type, entityId, viewer)
  if (denied) return denied

  const db = await createSupabaseServerClient()

  const { data: slot, error } = await db
    .from("entity_secret_slots")
    .select("id, source_column")
    .eq("entity_id", entityId)
    .eq("slot", slotName)
    .maybeSingle()

  if (error) throw error
  if (!slot) {
    return {
      ok: false,
      code: "not_found",
      formError: "That secret no longer exists.",
    }
  }

  if (slot.source_column) {
    return {
      ok: false,
      code: "validation",
      formError: "Unmark the field instead of deleting its secret.",
    }
  }

  const { error: deleteError } = await db
    .from("entity_secret_slots")
    .delete()
    .eq("id", slot.id)

  if (deleteError) throw deleteError
  return { ok: true, id: entityId }
}
