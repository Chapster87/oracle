import * as z from "zod"

import type { EntityType } from "@/types"

/**
 * A D&D Beyond link. Host-restricted so the branded card can never point
 * somewhere else.
 */
export const ddbUrlSchema = z
  .string()
  .trim()
  .url({ message: "Enter a valid URL" })
  .refine(
    (value) => {
      try {
        const host = new URL(value).hostname.toLowerCase()
        return host === "dndbeyond.com" || host.endsWith(".dndbeyond.com")
      } catch {
        return false
      }
    },
    { message: "Must be a dndbeyond.com URL" }
  )

export interface MetadataKeySpec {
  key: string
  label: string
  help: string
  /** `dm` keys are stripped from player payloads; `all` keys are ordinary data. */
  authority: "dm" | "all"
  appliesTo: EntityType[]
  schema: z.ZodType<string>
}

/**
 * The allow-list of editable `metadata` keys. One definition, consumed by both
 * the form registry and the Zod schemas so the two cannot drift (#23).
 */
export const METADATA_KEYS: MetadataKeySpec[] = [
  {
    key: "ddb_url",
    label: "D&D Beyond URL",
    help: "Link to the character sheet or encounter on dndbeyond.com.",
    authority: "all",
    appliesTo: ["players"],
    schema: ddbUrlSchema,
  },
  {
    key: "dm_notes",
    label: "DM Notes",
    help: "Private notes, visible only to DMs.",
    authority: "dm",
    appliesTo: [
      "characters",
      "locations",
      "factions",
      "players",
      "items",
      "religions",
      "story_arcs",
    ],
    schema: z.string().max(20_000),
  },
]

/** The metadata keys a given entity type exposes. */
export function metadataKeysFor(type: EntityType): MetadataKeySpec[] {
  return METADATA_KEYS.filter((spec) => spec.appliesTo.includes(type))
}

/** Keys that must be stripped from a player payload. */
export function dmOnlyMetadataKeys(): string[] {
  return METADATA_KEYS.filter((spec) => spec.authority === "dm").map(
    (spec) => spec.key
  )
}
