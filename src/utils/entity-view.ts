import type {
  Draft,
  Entity,
  EntityDetailData,
  EntityType,
  SecretSlot,
  Visibility,
} from "@/types"

import { ENTITY_META } from "./entity"
import { filterSlots, overlaySlots, type SlotViewer } from "./secrets"

/**
 * Removes DM-only fields from an entity before it is sent to a player.
 * Mirrors the RLS intent (viewers see the entity, not its secrets).
 */
export function stripSecrets(type: EntityType, entity: Entity): Entity {
  const sanitized = { ...entity } as Record<string, any>
  const secretField = ENTITY_META[type].secretField

  if (secretField) {
    delete sanitized[secretField]
  }

  if (sanitized.metadata) {
    const { dm_notes: _dmNotes, ...metadata } = sanitized.metadata
    sanitized.metadata = metadata
  }

  return sanitized as Entity
}

export interface EntityProjection {
  entity: Entity
  slots: SecretSlot[]
}

/**
 * Projects an entity and its slots for a viewer: the same predicate and slot
 * audience filter the live read path uses. Callers decide whether the viewer
 * may see the row at all; this decides what they see of it.
 */
export function projectEntity(
  type: EntityType,
  entity: Entity,
  slots: SecretSlot[],
  viewer: SlotViewer
): EntityProjection {
  const visibleSlots = filterSlots(slots, viewer)
  const visible = viewer.isDM ? entity : stripSecrets(type, entity)

  // Strip first, then overlay: a slot the viewer may see is restored after the
  // blanket DM-field strip, so an `owner` slot survives for its owner.
  return { entity: overlaySlots(visible, visibleSlots), slots: visibleSlots }
}

/** Builds the slot rows a draft's `slot_ops` describe. */
export function draftSlots(draft: Draft): SecretSlot[] {
  return draft.slot_ops
    .filter((op) => op.op === "upsert")
    .map((op, index) => ({
      id: `${draft.id}-${index}`,
      entity_id: draft.target_id,
      slot: op.slot,
      source_column: op.source_column ?? null,
      value: op.value,
      audience: op.audience ?? "dm",
      revealed_at: op.revealed_at ?? null,
      position: op.position ?? index,
    }))
}

/**
 * Renders a draft through the same projection as the live read path. A marked
 * column is nulled on the draft row first, mirroring what promotion writes, so
 * the player preview cannot see a value that only lives in a hidden slot.
 */
export function projectDraft(
  draft: Draft,
  viewer: SlotViewer
): EntityDetailData {
  const payload = draft.payload as Record<string, unknown>
  const entity = {
    id: draft.target_id,
    ...payload,
    name: String(payload.name ?? "Untitled"),
    owner_id: (payload.owner_id as string | undefined) ?? draft.created_by,
    visibility: (payload.visibility as Visibility | undefined) ?? "private",
    created_at: draft.created_at,
    updated_at: draft.updated_at,
  } as unknown as Entity

  for (const op of draft.slot_ops) {
    if (op.op === "upsert" && op.source_column) {
      ;(entity as unknown as Record<string, unknown>)[op.source_column] = null
    }
  }

  const { entity: projected, slots } = projectEntity(
    draft.model,
    entity,
    draftSlots(draft),
    viewer
  )

  return {
    type: draft.model,
    entity: projected,
    related: [],
    region: null,
    slots,
  }
}
