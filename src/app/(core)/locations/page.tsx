export const metadata = { title: "Locations" }

import React from "react"

import Heading from "@components/heading"
import Link from "@components/link"
import Text from "@components/text"

import EntityDirectory from "@/components/entity-directory"
import { requireViewer } from "@/server/auth"
import { getCampaignContext } from "@/server/campaigns"
import { getEntities } from "@/server/entities"

import s from "../../style.module.css"

/** Location browse landing. */
export default async function LocationsPage() {
  const viewer = await requireViewer()
  const { active } = await getCampaignContext()
  const items = await getEntities(
    "locations",
    viewer.role,
    viewer.userId,
    active?.id ?? null
  )

  return (
    <div className={s.card}>
      <header style={{ marginBottom: "24px" }}>
        <Heading level="h1">Locations</Heading>
        <Text style={{ color: "var(--muted-foreground)", marginTop: "8px" }}>
          Explore the regions, settlements, and places of interest.
        </Text>
        <div style={{ marginTop: "16px" }}>
          <Link href="/locations/new" buttonStyle>
            New Location
          </Link>
        </div>
      </header>

      <EntityDirectory items={items} />
    </div>
  )
}
