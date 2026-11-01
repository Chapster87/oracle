import type { ZodType } from "zod"

import type { EntityType } from "@/types"

import { characterCreateSchema, characterUpdateSchema } from "./character"
import { factionCreateSchema, factionUpdateSchema } from "./faction"
import { itemCreateSchema, itemUpdateSchema } from "./item"
import { locationCreateSchema, locationUpdateSchema } from "./location"
import { playerCreateSchema, playerUpdateSchema } from "./player"
import { religionCreateSchema, religionUpdateSchema } from "./religion"

export interface EntitySchemaPair {
  create: ZodType
  update: ZodType
}

/**
 * The one place a route, action, DAL, or MCP tool resolves an entity type to its
 * schema. The type is chosen by the caller, never read from the payload.
 */
export const ENTITY_SCHEMAS: Record<EntityType, EntitySchemaPair> = {
  characters: { create: characterCreateSchema, update: characterUpdateSchema },
  locations: { create: locationCreateSchema, update: locationUpdateSchema },
  factions: { create: factionCreateSchema, update: factionUpdateSchema },
  players: { create: playerCreateSchema, update: playerUpdateSchema },
  items: { create: itemCreateSchema, update: itemUpdateSchema },
  religions: { create: religionCreateSchema, update: religionUpdateSchema },
}
