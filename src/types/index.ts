/**
 * Core entity types for the Oracle campaign manager.
 */

export type Visibility = "public" | "private" | "secret"

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

export type Role = "DM" | "PLAYER"

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

/** URL segment / table name for each entity supported by the detail view. */
export type EntityType = "characters" | "locations" | "factions"

export type Entity = Character | Location | Faction

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
