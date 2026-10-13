import React from "react"

import EntityDirectory from "@/components/entity-directory"
import { getEntities } from "@/server/entities"
import { getSession } from "@/server/session"

import s from "../style.module.css"

interface PageProps {
  searchParams: Promise<{ role?: string }>
}

/** Character browse landing. */
export default async function CharactersPage({ searchParams }: PageProps) {
  const { role: roleOverride } = await searchParams
  const { role, userId } = getSession(roleOverride)
  const items = await getEntities("characters", role, userId)

  return (
    <div className={s.card}>
      <header style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "bold", margin: 0 }}>
          Characters
        </h1>
        <p style={{ color: "var(--muted-foreground)", marginTop: "8px" }}>
          Browse the people — allies, villains, and everyone in between.
        </p>
      </header>

      <EntityDirectory items={items} />
    </div>
  )
}
