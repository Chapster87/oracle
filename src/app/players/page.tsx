import React from "react"

import Heading from "@components/heading"
import Link from "@components/link"
import Text from "@components/text"

import EntityDirectory from "@/components/entity-directory"
import { getEntities } from "@/server/entities"
import { getSession } from "@/server/session"

import s from "../style.module.css"

interface PageProps {
  searchParams: Promise<{ role?: string }>
}

/** Player character browse landing. */
export default async function PlayersPage({ searchParams }: PageProps) {
  const { role: roleOverride } = await searchParams
  const { role, userId } = getSession(roleOverride)
  const items = await getEntities("players", role, userId)

  return (
    <div className={s.card}>
      <header style={{ marginBottom: "24px" }}>
        <Heading level="h1">Players</Heading>
        <Text style={{ color: "var(--muted-foreground)", marginTop: "8px" }}>
          The party — the heroes around the table.
        </Text>
        <div style={{ marginTop: "16px" }}>
          <Link href="/players/new" buttonStyle>
            New Player
          </Link>
        </div>
      </header>

      <EntityDirectory items={items} />
    </div>
  )
}
