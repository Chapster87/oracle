import React from "react"

import EntityDirectory from "@/components/entity-directory"
import { getEntities } from "@/server/entities"
import { getSession } from "@/server/session"

import s from "../style.module.css"

interface PageProps {
  searchParams: Promise<{ role?: string }>
}

/** Faction browse landing. */
export default async function FactionsPage({ searchParams }: PageProps) {
  const { role: roleOverride } = await searchParams
  const { role, userId } = getSession(roleOverride)
  const items = await getEntities("factions", role, userId)

  return (
    <div className={s.card}>
      <header style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "bold", margin: 0 }}>
          Factions
        </h1>
        <p style={{ color: "var(--muted-foreground)", marginTop: "8px" }}>
          Organizations, orders, and powers at play in the world.
        </p>
      </header>

      <EntityDirectory items={items} />
    </div>
  )
}
