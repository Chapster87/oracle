import * as z from "zod"

import type { EntityType } from "@/types"

import { metadataKeysFor } from "./metadata"

/**
 * Access-control fields. They are *representable* in a payload; permission is a
 * separate RBAC check, because only the server knows the actor's campaign
 * membership and the target row's current scope (#22).
 */
export const accessFields = {
  owner_id: z.uuid().optional(),
  campaign_id: z.uuid().nullable().optional(),
  visibility: z.enum(["public", "private"]).optional(),
}

/** A tag list: trimmed, non-empty, deduplicated, bounded. */
export const tags = z
  .array(z.string().trim().min(1).max(60))
  .max(50)
  .transform((values) => [...new Set(values)])

/**
 * The `metadata` object for a type, built from the key registry (#23) so the
 * schema and the form cannot drift. A type with no keys gets an empty strict
 * object, which rejects every key rather than passing them through.
 */
export function metadataSchemaFor(type: EntityType) {
  const shape: Record<string, z.ZodType> = {}

  for (const spec of metadataKeysFor(type)) {
    shape[spec.key] = spec.schema.nullable().optional()
  }

  return z.strictObject(shape)
}

/** Strips Next.js's generated `$ACTION_*` keys before strict parsing. */
export function formToObject(formData: FormData): Record<string, unknown> {
  return Object.fromEntries(
    [...formData].filter(([key]) => !key.startsWith("$ACTION_"))
  )
}
