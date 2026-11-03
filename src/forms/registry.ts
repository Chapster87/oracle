import type { EntityType } from "@/types"

import type { Viewer } from "@/server/rbac"

import { metadataKeysFor } from "@/schemas/metadata"

export type FieldWidget =
  | "text"
  | "textarea"
  | "number"
  | "checkbox"
  | "tags"
  | "list"
  | "select"
  | "entity"
  | "json"

export interface FieldSpec {
  /** The payload key. Dotted for nested fields, e.g. `metadata.ddb_url`. */
  name: string
  label: string
  widget: FieldWidget
  help?: string
  required?: boolean
  /** `dm` fields are hidden from anyone who is not DM/ADMIN. */
  authority?: "dm" | "all"
  /** Static options for a `select`. */
  options?: { value: string; label: string }[]
  /** Which option list the route must supply for an `entity` widget. */
  optionSource?: "locations" | "campaigns"
  rows?: number
}

const name: FieldSpec = {
  name: "name",
  label: "Name",
  widget: "text",
  required: true,
  help: "The entity's display name.",
}

const tags: FieldSpec = {
  name: "tags",
  label: "Tags",
  widget: "tags",
  help: "Press Enter to add. Duplicates are ignored.",
}

/** Access-control fields, appended to every type. `owner_id` is server-set. */
const accessSpecs: FieldSpec[] = [
  {
    name: "visibility",
    label: "Visibility",
    widget: "select",
    help: "Public entities are visible to everyone in the campaign.",
    options: [
      { value: "private", label: "Private" },
      { value: "public", label: "Public" },
    ],
  },
  {
    name: "campaign_id",
    label: "Campaign",
    widget: "entity",
    optionSource: "campaigns",
    help: "Leave empty for a global entity.",
  },
]

const CONTENT_SPECS: Record<EntityType, FieldSpec[]> = {
  characters: [
    name,
    { name: "species", label: "Species", widget: "text" },
    { name: "class", label: "Class", widget: "text" },
    { name: "alignment", label: "Alignment", widget: "text" },
    { name: "role", label: "Role", widget: "text" },
    { name: "appearance", label: "Appearance", widget: "textarea", rows: 4 },
    { name: "personality", label: "Personality", widget: "textarea", rows: 4 },
    { name: "is_deceased", label: "Deceased", widget: "checkbox" },
    tags,
  ],
  locations: [
    name,
    { name: "type", label: "Type", widget: "text" },
    { name: "sub_type", label: "Sub-type", widget: "text" },
    {
      name: "region_id",
      label: "Region",
      widget: "entity",
      optionSource: "locations",
      help: "The parent region, if this place sits inside one.",
    },
    { name: "overview", label: "Overview", widget: "textarea", rows: 4 },
    { name: "history", label: "History", widget: "textarea", rows: 4 },
    { name: "inhabitants", label: "Inhabitants", widget: "textarea", rows: 3 },
    {
      name: "points_of_interest",
      label: "Points of Interest",
      widget: "list",
      help: "Ordered list — add a row per place worth visiting.",
    },
    {
      name: "map_data",
      label: "Map Data",
      widget: "textarea",
      rows: 4,
      help: "Opaque map payload; the detail view renders a placeholder for now.",
    },
    tags,
  ],
  factions: [
    name,
    { name: "alignment", label: "Alignment", widget: "text" },
    { name: "overview", label: "Overview", widget: "textarea", rows: 4 },
    { name: "goals", label: "Goals", widget: "textarea", rows: 4 },
    { name: "beliefs", label: "Beliefs", widget: "textarea", rows: 4 },
    tags,
  ],
  players: [
    name,
    { name: "species", label: "Species", widget: "text" },
    { name: "class_es", label: "Class", widget: "text" },
    { name: "alignment", label: "Alignment", widget: "text" },
    { name: "level", label: "Level", widget: "number" },
    {
      name: "homeland_id",
      label: "Homeland",
      widget: "entity",
      optionSource: "locations",
    },
    {
      name: "hometown_id",
      label: "Hometown",
      widget: "entity",
      optionSource: "locations",
    },
    { name: "background", label: "Background", widget: "textarea", rows: 4 },
    { name: "backstory", label: "Backstory", widget: "textarea", rows: 5 },
  ],
  items: [
    name,
    { name: "type", label: "Type", widget: "text" },
    { name: "rarity", label: "Rarity", widget: "text" },
    { name: "description", label: "Description", widget: "textarea", rows: 4 },
    { name: "history", label: "History", widget: "textarea", rows: 4 },
    {
      name: "role_in_campaign",
      label: "Role in Campaign",
      widget: "textarea",
      rows: 3,
    },
    tags,
  ],
  religions: [
    name,
    { name: "type", label: "Type", widget: "text" },
    { name: "overview", label: "Overview", widget: "textarea", rows: 4 },
    {
      name: "domains_teachings",
      label: "Domains and Teachings",
      widget: "textarea",
      rows: 4,
    },
    {
      name: "worship_rituals",
      label: "Worship and Rituals",
      widget: "textarea",
      rows: 4,
    },
    {
      name: "clergy_followers",
      label: "Clergy and Followers",
      widget: "textarea",
      rows: 3,
    },
    {
      name: "history_myths",
      label: "History and Myths",
      widget: "textarea",
      rows: 4,
    },
    {
      name: "role_in_campaign",
      label: "Role in Campaign",
      widget: "textarea",
      rows: 3,
    },
    tags,
  ],
  story_arcs: [
    name,
    {
      name: "status",
      label: "Status",
      widget: "select",
      options: [
        { value: "planned", label: "Planned" },
        { value: "active", label: "Active" },
        { value: "completed", label: "Completed" },
      ],
    },
    { name: "target_level", label: "Target Level", widget: "text" },
    { name: "session_count", label: "Sessions", widget: "number" },
    { name: "overview", label: "Overview", widget: "textarea", rows: 4 },
    {
      name: "content",
      label: "Plan",
      widget: "textarea",
      rows: 12,
      help: "The full plan document, including the session breakdown.",
    },
    {
      name: "needed_resources",
      label: "Needed Resources",
      widget: "json",
      rows: 6,
      help: "JSON: { major: [{ id, name, type }], minor: [{ name, type }] }.",
    },
    tags,
  ],
}

/** Metadata fields come from the key registry (#23), so the two cannot drift. */
function metadataSpecs(type: EntityType): FieldSpec[] {
  return metadataKeysFor(type).map((spec) => ({
    name: `metadata.${spec.key}`,
    label: spec.label,
    help: spec.help,
    widget: spec.key === "ddb_url" ? "text" : "textarea",
    authority: spec.authority === "dm" ? "dm" : "all",
    rows: 3,
  }))
}

/** Every field the form renders for a type, before authorization. */
export function fieldSpecsFor(type: EntityType): FieldSpec[] {
  return [...CONTENT_SPECS[type], ...metadataSpecs(type), ...accessSpecs]
}

/**
 * Drops fields the viewer may not set. Only DM/ADMIN may write at all, so this
 * is the seam for field-level rules rather than a live restriction today.
 */
export function allowedFields(specs: FieldSpec[], viewer: Viewer): FieldSpec[] {
  const isDm = viewer.role === "DM" || viewer.role === "ADMIN"
  return specs.filter((spec) => spec.authority !== "dm" || isDm)
}
