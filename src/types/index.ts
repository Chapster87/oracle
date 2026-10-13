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

/** URL segment / table name for each entity supported by the detail view. */
export type EntityType =
  "characters" | "locations" | "factions" | "players" | "items" | "religions"

export type Entity = Character | Location | Faction | Player | Item | Religion

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

/** A campaign Story Log entry (the `campaign_logs` table). */
export interface StoryLogEntry {
  id: string
  name: string
  content: string | null
  created_at: string
}
