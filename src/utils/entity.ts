import type { Character, Entity, EntityType, Faction, Location } from "@/types"

/**
 * Maps each entity type to its public route segment. Type-specific routes were
 * chosen over a single `/entities/[type]` route so URLs read as the domain does.
 */
const ENTITY_ROUTES: Record<EntityType, string> = {
  characters: "characters",
  locations: "locations",
  factions: "factions",
}

/** Whether a related entity type has a browsable detail route. */
export function isLinkableEntity(type: string): type is EntityType {
  return type in ENTITY_ROUTES
}

/** Builds the detail URL for an entity. */
export function entityPath(type: EntityType, id: string): string {
  return `/${ENTITY_ROUTES[type]}/${id}`
}

/**
 * The type-specific sub-header shown under an entity name: species/class for
 * characters, type/sub-type for locations, alignment for factions.
 */
export function entitySubtitle(type: EntityType, entity: Entity): string {
  if (type === "characters") {
    const character = entity as Character
    return [character.species, character.class].filter(Boolean).join(" • ")
  }

  if (type === "locations") {
    const location = entity as Location
    return [location.type, location.sub_type].filter(Boolean).join(" • ")
  }

  return (entity as Faction).alignment ?? ""
}
