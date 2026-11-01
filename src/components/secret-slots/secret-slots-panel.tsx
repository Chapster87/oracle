import { fieldSpecsFor } from "@/forms/registry"
import {
  addSecretSlotAction,
  deleteSecretSlotAction,
  markSecretFieldAction,
  saveSecretSlotAction,
  setSecretAudienceAction,
  unmarkSecretFieldAction,
} from "@/server/actions/secrets"
import { loadSlots } from "@/server/secrets"
import { supabaseAdmin } from "@/server/supabase"
import type { Entity, EntityType } from "@/types"
import { isMarkableColumn } from "@/utils/secrets"

import SecretSlots, { type SecretFieldRow } from "./index"

/**
 * Loads the entity and its slots, then hands the DM-only controls their data.
 * Only rendered on the edit route, where an entity already exists.
 */
export default async function SecretSlotsPanel({
  type,
  entityId,
}: {
  type: EntityType
  entityId: string
}) {
  const { data: entity, error } = await supabaseAdmin
    .from(type)
    .select("*")
    .eq("id", entityId)
    .maybeSingle()

  if (error) throw error
  if (!entity) return null

  const slots = await loadSlots(entityId)
  const marked = new Set(
    slots
      .map((slot) => slot.source_column)
      .filter((column): column is string => Boolean(column))
  )
  const row = entity as unknown as Entity

  const fields: SecretFieldRow[] = fieldSpecsFor(type)
    .filter(
      (spec) =>
        !spec.name.startsWith("metadata.") && isMarkableColumn(row, spec.name)
    )
    .map((spec) => ({
      name: spec.name,
      label: spec.label,
      value:
        entity[spec.name] === null || entity[spec.name] === undefined
          ? null
          : String(entity[spec.name]),
      slotted: marked.has(spec.name),
    }))

  return (
    <SecretSlots
      type={type}
      entityId={entityId}
      fields={fields}
      slots={slots}
      actions={{
        mark: markSecretFieldAction,
        unmark: unmarkSecretFieldAction,
        add: addSecretSlotAction,
        save: saveSecretSlotAction,
        remove: deleteSecretSlotAction,
        setAudience: setSecretAudienceAction,
      }}
    />
  )
}
