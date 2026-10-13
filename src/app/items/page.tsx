import React from "react"

import EntityDirectory from "@/components/entity-directory"
import { getEntities } from "@/server/entities"
import { getSession } from "@/server/session"

import s from "../style.module.css"

interface PageProps {
  searchParams: Promise<{ role?: string }>
}

/** Item browse landing. */
export default async function ItemsPage({ searchParams }: PageProps) {
  const { role: roleOverride } = await searchParams
  const { role, userId } = getSession(roleOverride)
  const items = await getEntities("items", role, userId)

  return (
    <div className={s.card}>
      <header style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "bold", margin: 0 }}>
          Items
        </h1>
        <p style={{ color: "var(--muted-foreground)", marginTop: "8px" }}>
          Relics, treasure, and artifacts of note.
        </p>
      </header>

      <EntityDirectory items={items} />
    </div>
  )
}
