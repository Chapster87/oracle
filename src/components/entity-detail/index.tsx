"use client"

import React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/tabs"

import type { EntityDetailData } from "@/types"
import { ENTITY_META } from "@/utils/entity"

import EntityHeader from "./header"
import { LAYOUTS } from "./layouts"
import PrivateLog from "./private-log"
import Relationships from "./relationships"
import s from "./style.module.css"

/**
 * Renders the type-specific secret payload inside the Private Log treatment.
 * Uses the type's `secretField` when it has one, otherwise `metadata.dm_notes`.
 */
function DmNotes({ data }: { data: EntityDetailData }) {
  const secretField = ENTITY_META[data.type].secretField
  const record = data.entity as Record<string, any>
  const notes = secretField ? record[secretField] : record.metadata?.dm_notes

  if (Array.isArray(notes)) {
    return (
      <PrivateLog>
        {notes.length > 0 ? (
          <ul className={s.list}>
            {notes.map((note, index) => (
              <li key={index}>{note}</li>
            ))}
          </ul>
        ) : null}
      </PrivateLog>
    )
  }

  return <PrivateLog>{notes}</PrivateLog>
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
