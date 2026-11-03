/**
 * Core entity types for the Oracle campaign manager.
 */

export type Visibility = "public" | "private"

/** Who may receive a secret slot's value. */
export type SecretAudience = "dm" | "owner" | "public"

/**
 * A value withheld from some viewers. `slot` is always a numbered `secret_N`
 * name; `source_column` records the column it was marked from, if any.
 */
export interface SecretSlot {
  id: string
  entity_id: string
  slot: string
  source_column: string | null
  value: unknown
  audience: SecretAudience
  revealed_at: string | null
  position: number
}

export interface WorldLore {
  id: string
  name: string
  content: string
  category?: string
  tags?: string[]
  metadata?: Record<string, any>
  campaign_id?: string | null
  owner_id: string
  visibility: Visibility
  created_at: string
  updated_at: string
}

export type Role = "ADMIN" | "DM" | "PLAYER"

/**
 * Fields shared by every content entity that supports the Layered Detail view.
 */
export interface BaseEntity {
  id: string
  name: string
  tags?: string[]
  metadata?: Record<string, any>
  campaign_id?: string | null
  owner_id: string
  visibility: Visibility
  created_at: string
  updated_at: string
}

export interface Character extends BaseEntity {
  species?: string | null
  class?: string | null
  alignment?: string | null
  appearance?: string | null
  personality?: string | null
  role?: string | null
  /** DM-only. Stripped from the payload for players. */
  secrets?: string | null
  is_deceased?: boolean | null
}

export interface Location extends BaseEntity {
  type?: string | null
  sub_type?: string | null
  region_id?: string | null
  overview?: string | null
  history?: string | null
  inhabitants?: string | null
  points_of_interest?: any[] | null
  /** DM-only. Stripped from the payload for players. */
  rumors_lore?: string[] | null
  map_data?: string | null
}

export interface Faction extends BaseEntity {
  alignment?: string | null
  overview?: string | null
  goals?: string | null
  beliefs?: string | null
}

/** A player character. `class_es` is the (legacy) column name for class. */
export interface Player extends BaseEntity {
  species?: string | null
  class_es?: string | null
  alignment?: string | null
  level?: number | null
  homeland_id?: string | null
  hometown_id?: string | null
  background?: string | null
  backstory?: string | null
}

export interface Item extends BaseEntity {
  type?: string | null
  rarity?: string | null
  description?: string | null
  history?: string | null
  role_in_campaign?: string | null
}

export interface Religion extends BaseEntity {
  type?: string | null
  overview?: string | null
  domains_teachings?: string | null
  worship_rituals?: string | null
  clergy_followers?: string | null
  history_myths?: string | null
  role_in_campaign?: string | null
}

export type StoryArcStatus = "planned" | "active" | "completed"

/** A planning document that bridges sessions and references its resources. */
export interface StoryArc extends BaseEntity {
  status: StoryArcStatus
  target_level?: string | null
  session_count?: number | null
  overview?: string | null
  content?: string | null
  needed_resources?: {
    major?: { id?: string; name: string; type: string }[]
    minor?: { id?: string; name: string; type: string }[]
  } | null
}

/** URL segment / table name for each entity supported by the detail view. */
export type EntityType =
  | "characters"
  | "locations"
  | "factions"
  | "players"
  | "items"
  | "religions"
  | "story_arcs"

export type Entity =
  Character | Location | Faction | Player | Item | Religion | StoryArc

/** A single link between two entities, resolved to a display name. */
export interface RelatedEntity {
  id: string
  name: string
  type: EntityType | "world_lore"
  relationType: string
}

export interface EntityLink {
  id: string
  name: string
}

/** The complete, RBAC-filtered payload rendered by the entity detail view. */
export interface EntityDetailData {
  type: EntityType
  entity: Entity
  related: RelatedEntity[]
  region: EntityLink | null
  /** Slots the viewer may see, already audience-filtered. */
  slots: SecretSlot[]
}

/** Lightweight row rendered by the browse/directory landing pages. */
export interface EntitySummary {
  id: string
  name: string
  type: EntityType
  visibility: Visibility
  subtitle: string
  tags: string[]
}

/** A campaign Story Log entry (the `campaign_logs` table). */
export interface StoryLogEntry {
  id: string
  name: string
  content: string | null
  created_at: string
}

export type WriteErrorCode =
  | "validation"
  | "conflict"
  | "forbidden"
  | "not_found"
  | "constraint"
  | "dependency"

/**
 * The result of a write. Expected failures are returned; unexpected ones are
 * thrown (#24). `fieldErrors` is keyed by the input's `name` attribute.
 */
export type WriteResult =
  | { ok: true; id: string }
  | {
      ok: false
      code: WriteErrorCode
      fieldErrors?: Record<string, string[]>
      formError?: string
    }

/** A proposed entity change staged for DM review. */
export type DraftKind = "create" | "update" | "delete"

export type DraftStatus = "pending" | "promoted" | "discarded"

/** One secret-slot operation carried by a draft. */
export interface SlotOp {
  op: "upsert" | "delete"
  slot: string
  source_column?: string | null
  value?: unknown
  audience?: SecretAudience
  revealed_at?: string | null
  position?: number
}

export interface Draft {
  id: string
  kind: DraftKind
  model: EntityType
  target_id: string
  campaign_id: string | null
  payload: Record<string, unknown>
  slot_ops: SlotOp[]
  base_updated_at: string | null
  status: DraftStatus
  reason: string | null
  lane: string | null
  created_by: string
  decided_by: string | null
  decided_at: string | null
  dm_edited_at: string | null
  supersedes_id: string | null
  batch_id: string
  created_at: string
  updated_at: string
}

export interface DraftBatch {
  id: string
  campaign_id: string | null
  created_by: string
  status: "open" | "closed"
  plan_id: string | null
  created_at: string
  updated_at: string
  decided_at: string | null
}
