"use client"

import React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/tabs"

import type {
  Character,
  EntityDetailData,
  EntityType,
  Faction,
  Location,
} from "@/types"

import CharacterLayout from "./layouts/character"
import FactionLayout from "./layouts/faction"
import LocationLayout from "./layouts/location"
import EntityHeader from "./header"
import PrivateLog from "./private-log"
import Relationships from "./relationships"
import s from "./style.module.css"

/** Registry mapping each entity type to its specialized content layout. */
const LAYOUTS: Record<
  EntityType,
  React.ComponentType<{ data: EntityDetailData }>
> = {
  characters: CharacterLayout,
  locations: LocationLayout,
  factions: FactionLayout,
}

/** Renders the type-specific secret payload inside the Private Log treatment. */
function DmNotes({ data }: { data: EntityDetailData }) {
  if (data.type === "characters") {
    return <PrivateLog>{(data.entity as Character).secrets}</PrivateLog>
  }

  if (data.type === "locations") {
    const rumors = (data.entity as Location).rumors_lore ?? []
    return (
      <PrivateLog>
        {rumors.length > 0 ? (
          <ul className={s.list}>
            {rumors.map((rumor, index) => (
              <li key={index}>{rumor}</li>
            ))}
          </ul>
        ) : null}
      </PrivateLog>
    )
  }

  return <PrivateLog>{(data.entity as Faction).metadata?.dm_notes}</PrivateLog>
}

interface EntityDetailProps {
  data: EntityDetailData
  isDM: boolean
}

/**
 * The Layered Detail view (Research #10): a public identity header, tabbed
 * content layers, and a DM-only "DM Notes" tab rendered with the Private Log
 * treatment. Type-specific content is delegated via the layout registry.
 */
export default function EntityDetail({ data, isDM }: EntityDetailProps) {
  const Layout = LAYOUTS[data.type]

  return (
    <div className={s.container}>
      <EntityHeader data={data} />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
          {isDM && <TabsTrigger value="dm-notes">DM Notes</TabsTrigger>}
        </TabsList>

        <Layout data={data} />

        <TabsContent value="relationships">
          <Relationships data={data} />
        </TabsContent>

        {isDM && (
          <TabsContent value="dm-notes">
            <DmNotes data={data} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
