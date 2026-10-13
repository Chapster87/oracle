import type { EntityType } from "@/types"

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

/** Builds the detail URL for a related entity. */
export function entityPath(type: EntityType, id: string): string {
  return `/${ENTITY_ROUTES[type]}/${id}`
}
