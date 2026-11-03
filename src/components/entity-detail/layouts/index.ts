import type React from "react"

import type { EntityDetailData, EntityType } from "@/types"

import CharacterLayout from "./character"
import FactionLayout from "./faction"
import ItemLayout from "./item"
import LocationLayout from "./location"
import PlayerLayout from "./player"
import ReligionLayout from "./religion"
import StoryArcLayout from "./story-arc"

/** Registry mapping each entity type to its specialized content layout. */
export const LAYOUTS: Record<
  EntityType,
  React.ComponentType<{ data: EntityDetailData; isDM?: boolean }>
> = {
  characters: CharacterLayout,
  locations: LocationLayout,
  factions: FactionLayout,
  players: PlayerLayout,
  items: ItemLayout,
  religions: ReligionLayout,
  story_arcs: StoryArcLayout,
}
