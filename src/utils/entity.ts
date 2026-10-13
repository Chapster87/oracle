import type {
  Character,
  Entity,
  EntityType,
  Faction,
  Item,
  Location,
  Player,
  Religion,
} from "@/types"

interface EntityTypeMeta {
  /** Public route segment, e.g. `/characters`. */
  path: string
  /** Plural display label, e.g. "Characters". */
  label: string
  /** Singular display label, for relationship rows, e.g. "Character". */
  singular: string
  /**
   * Column holding DM-only content for this type, or null when DM notes live in
   * `metadata.dm_notes` instead.
   */
  secretField: string | null
}

/**
 * Single source of truth for the entity types the app understands. Adding a new
 * type means one entry here, a `types` interface, a layout, and a route pair.
 */
export const ENTITY_META: Record<EntityType, EntityTypeMeta> = {
  characters: {
    path: "characters",
    label: "Characters",
    singular: "Character",
    secretField: "secrets",
  },
  locations: {
    path: "locations",
    label: "Locations",
    singular: "Location",
    secretField: "rumors_lore",
  },
  factions: {
    path: "factions",
    label: "Factions",
    singular: "Faction",
    secretField: null,
  },
  players: {
    path: "players",
    label: "Players",
    singular: "Player",
    secretField: null,
  },
  items: {
    path: "items",
    label: "Items",
    singular: "Item",
    secretField: null,
  },
  religions: {
    path: "religions",
    label: "Religions",
    singular: "Religion",
    secretField: null,
  },
}

export const ENTITY_TYPES = Object.keys(ENTITY_META) as EntityType[]

/** Whether a string is a known, routable entity type. */
export function isEntityType(value: string): value is EntityType {
  return value in ENTITY_META
}

/** Whether a related entity type has a browsable detail route. */
export function isLinkableEntity(type: string): type is EntityType {
  return isEntityType(type)
}

/** Builds the detail URL for an entity. */
export function entityPath(type: EntityType, id: string): string {
  return `/${ENTITY_META[type].path}/${id}`
}

/** Singular display label for a type, used on relationship rows. */
export function entityLabel(type: EntityType): string {
  return ENTITY_META[type].singular
}

/**
 * The type-specific sub-header shown under an entity name: species/class for
 * characters, type/sub-type for locations, alignment for factions, and so on.
 */
export function entitySubtitle(type: EntityType, entity: Entity): string {
  switch (type) {
    case "characters": {
      const character = entity as Character
      return [character.species, character.class].filter(Boolean).join(" • ")
    }
    case "locations": {
      const location = entity as Location
      return [location.type, location.sub_type].filter(Boolean).join(" • ")
    }
    case "players": {
      const player = entity as Player
      return [player.species, player.class_es].filter(Boolean).join(" • ")
    }
    case "items": {
      const item = entity as Item
      return [item.type, item.rarity].filter(Boolean).join(" • ")
    }
    case "religions":
      return (entity as Religion).type ?? ""
    case "factions":
      return (entity as Faction).alignment ?? ""
  }
}
