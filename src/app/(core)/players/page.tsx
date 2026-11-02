import React from "react"

import Heading from "@components/heading"
import Link from "@components/link"
import Text from "@components/text"

import EntityDirectory from "@/components/entity-directory"
import { requireViewer } from "@/server/auth"
import { getCampaignContext } from "@/server/campaigns"
import { getEntities } from "@/server/entities"

import s from "../../style.module.css"

/** Player character browse landing. */
export default async function PlayersPage() {
  const viewer = await requireViewer()
  const { active } = await getCampaignContext()
  const items = await getEntities(
    "players",
    viewer.role,
    viewer.userId,
    active?.id ?? null
  )

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
