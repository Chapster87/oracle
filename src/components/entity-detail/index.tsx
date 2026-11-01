"use client"

import React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/tabs"
import Text from "@components/text"

import type { EntityDetailData, SecretAudience, SecretSlot } from "@/types"

import EntityHeader from "./header"
import { LAYOUTS } from "./layouts"
import PrivateLog, { type PrivateLogTone } from "./private-log"
import Relationships from "./relationships"
import s from "./style.module.css"

function renderSlotValue(value: unknown): React.ReactNode {
  if (Array.isArray(value)) {
    return (
      <ul className={s.list}>
        {value.map((item, index) => (
          <li key={index}>{String(item)}</li>
        ))}
      </ul>
    )
  }
  if (value && typeof value === "object") return JSON.stringify(value)
  return String(value ?? "")
}

function secretTitle(slot: SecretSlot, isDM: boolean): string {
  const number = slot.slot.replace(/^secret_/, "")
  const source = slot.source_column ? ` — from ${slot.source_column}` : ""
  const audience = isDM ? ` (${slot.audience})` : ""

  return `Secret ${number}${source}${audience}`
}

/**
 * The DM-only scratchpad. Deliberately separate from secrets: this is prose the
 * DM keeps about the entity, not a value withheld from a player.
 */
function DmNotes({ data }: { data: EntityDetailData }) {
  const record = data.entity as Record<string, any>

  return <PrivateLog>{record.metadata?.dm_notes}</PrivateLog>
}

function toneFor(audience: SecretAudience): PrivateLogTone {
  if (audience === "public") return "revealed"
  if (audience === "owner") return "shared"
  return "hidden"
}

/** Every secret the viewer may see, each in its own Private Log. */
function Secrets({ data, isDM }: { data: EntityDetailData; isDM: boolean }) {
  if (data.slots.length === 0) {
    return <Text>No secrets recorded.</Text>
  }

  return (
    <>
      {data.slots.map((slot) => (
        <PrivateLog
          key={slot.id}
          title={secretTitle(slot, isDM)}
          tone={toneFor(slot.audience)}
        >
          {renderSlotValue(slot.value)}
        </PrivateLog>
      ))}
    </>
  )
}

interface EntityDetailProps {
  data: EntityDetailData
  isDM: boolean
}

/**
 * The Layered Detail view (Research #10): a public identity header, tabbed
 * content layers, and DM-only "DM Notes" and "Secrets" tabs rendered with the
 * Private Log treatment. Type-specific content is delegated via the layout
 * registry.
 */
export default function EntityDetail({ data, isDM }: EntityDetailProps) {
  const Layout = LAYOUTS[data.type]

  return (
    <div className={s.container}>
      <EntityHeader data={data} isDM={isDM} />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
          {isDM && <TabsTrigger value="dm-notes">DM Notes</TabsTrigger>}
          {data.slots.length > 0 && (
            <TabsTrigger value="secrets">Secrets</TabsTrigger>
          )}
        </TabsList>

        <Layout data={data} isDM={isDM} />

        <TabsContent value="relationships">
          <Relationships data={data} />
        </TabsContent>

        {isDM && (
          <TabsContent value="dm-notes">
            <DmNotes data={data} />
          </TabsContent>
        )}

        {data.slots.length > 0 && (
          <TabsContent value="secrets">
            <Secrets data={data} isDM={isDM} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
