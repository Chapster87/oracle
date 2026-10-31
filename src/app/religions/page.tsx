import React from "react"

import Heading from "@components/heading"
import Text from "@components/text"

import EntityDirectory from "@/components/entity-directory"
import { getEntities } from "@/server/entities"
import { getSession } from "@/server/session"

import s from "../style.module.css"

interface PageProps {
  searchParams: Promise<{ role?: string }>
}

/** Religion browse landing. */
export default async function ReligionsPage({ searchParams }: PageProps) {
  const { role: roleOverride } = await searchParams
  const { role, userId } = getSession(roleOverride)
  const items = await getEntities("religions", role, userId)

  return (
    <div className={s.card}>
      <header style={{ marginBottom: "24px" }}>
        <Heading level="h1">Religions</Heading>
        <Text style={{ color: "var(--muted-foreground)", marginTop: "8px" }}>
          Deities, faiths, and belief systems of the world.
        </Text>
      </header>

      <EntityDirectory items={items} />
    </div>
  )
}
