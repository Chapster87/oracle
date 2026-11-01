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

/** Character browse landing. */
export default async function CharactersPage({ searchParams }: PageProps) {
  const { role: roleOverride } = await searchParams
  const { role, userId } = getSession(roleOverride)
  const items = await getEntities("characters", role, userId)

  return (
    <div className={s.card}>
      <header style={{ marginBottom: "24px" }}>
        <Heading level="h1">Characters</Heading>
        <Text style={{ color: "var(--muted-foreground)", marginTop: "8px" }}>
          Browse the people — allies, villains, and everyone in between.
        </Text>
        <div style={{ marginTop: "16px" }}>
          <Link href="/characters/new" buttonStyle>
            New Character
          </Link>
        </div>
      </header>

      <EntityDirectory items={items} />
    </div>
  )
}
