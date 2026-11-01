import type { SecretSlot } from "@/types"

import { supabaseAdmin } from "./supabase"

const SLOT_COLUMNS =
  "id, entity_id, slot, source_column, value, audience, revealed_at, position"

/** Loads every slot for one entity, in display order. */
export async function loadSlots(entityId: string): Promise<SecretSlot[]> {
  const { data, error } = await supabaseAdmin
    .from("entity_secret_slots")
    .select(SLOT_COLUMNS)
    .eq("entity_id", entityId)
    .order("position", { ascending: true })

  if (error) {
    console.error("Error loading secret slots:", error)
    return []
  }
  return (data ?? []) as SecretSlot[]
}

/** Loads slots for many entities at once, grouped by entity id. */
export async function loadSlotsFor(
  entityIds: string[]
): Promise<Map<string, SecretSlot[]>> {
  const byEntity = new Map<string, SecretSlot[]>()
  if (entityIds.length === 0) return byEntity

  const { data, error } = await supabaseAdmin
    .from("entity_secret_slots")
    .select(SLOT_COLUMNS)
    .in("entity_id", entityIds)
    .order("position", { ascending: true })

  if (error) {
    console.error("Error loading secret slots:", error)
    return byEntity
  }

  for (const slot of (data ?? []) as SecretSlot[]) {
    const list = byEntity.get(slot.entity_id) ?? []
    list.push(slot)
    byEntity.set(slot.entity_id, list)
  }

  return byEntity
}
