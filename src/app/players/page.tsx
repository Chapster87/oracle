import React from "react"

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
        <h1 style={{ fontSize: "32px", fontWeight: "bold", margin: 0 }}>
          Players
        </h1>
        <p style={{ color: "var(--muted-foreground)", marginTop: "8px" }}>
          The party — the heroes around the table.
        </p>
      </header>

      <EntityDirectory items={items} />
    </div>
  )
}
