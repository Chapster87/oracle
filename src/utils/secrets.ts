import type { Entity, SecretSlot } from "@/types"

/**
 * Columns that are never markable: identity, scope, and bookkeeping. `name`
 * stays the identity anchor; a true name belongs in a `secret_N` slot.
 */
const NON_MARKABLE = new Set([
  "id",
  "name",
  "owner_id",
  "campaign_id",
  "visibility",
  "created_at",
  "updated_at",
])

const SECRET_SLOT_RE = /^secret_\d+$/

/** Whether a slot name is a free-standing `secret_N` slot. */
export function isSecretSlotName(slot: string): boolean {
  return SECRET_SLOT_RE.test(slot)
}

/** Whether a column on this row may be moved into a slot. */
export function isMarkableColumn(entity: Entity, column: string): boolean {
  return column in entity && !NON_MARKABLE.has(column)
}

/** Whether a slot name is legal for this row. */
export function isValidSlotName(entity: Entity, slot: string): boolean {
  return isSecretSlotName(slot) || isMarkableColumn(entity, slot)
}

export interface SlotViewer {
  isDM: boolean
  userId: string
  ownerId: string | null
}

/**
 * DM/ADMIN sees every slot; a non-DM owner sees `owner` and `public`; anyone
 * else sees `public` only.
 */
export function canSeeSlot(slot: SecretSlot, viewer: SlotViewer): boolean {
  if (viewer.isDM) return true
  if (slot.audience === "public") return true
  if (slot.audience === "owner") {
    return viewer.ownerId !== null && viewer.ownerId === viewer.userId
  }
  return false
}

/** Drops every slot the viewer may not see — no placeholders, no slot names. */
export function filterSlots(
  slots: SecretSlot[],
  viewer: SlotViewer
): SecretSlot[] {
  return slots.filter((slot) => canSeeSlot(slot, viewer))
}

/**
 * Writes visible column-named slots back onto the entity, so a DM receives the
 * full record and a player receives the same shape minus what they may not see.
 * `secret_N` slots are not columns and are left for the caller to render.
 */
export function overlaySlots<T extends Entity>(
  entity: T,
  slots: SecretSlot[]
): T {
  const next = { ...entity } as Record<string, unknown>

  for (const slot of slots) {
    if (isSecretSlotName(slot.slot)) continue
    if (NON_MARKABLE.has(slot.slot)) continue
    next[slot.slot] = slot.value
  }

  return next as T
}
