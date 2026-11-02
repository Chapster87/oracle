export const metadata = { title: "Religions" }

import React from "react"

import Heading from "@components/heading"
import Link from "@components/link"
import Text from "@components/text"

import EntityDirectory from "@/components/entity-directory"
import { requireViewer } from "@/server/auth"
import { getCampaignContext } from "@/server/campaigns"
import { getEntities } from "@/server/entities"

import s from "../../style.module.css"

/** Religion browse landing. */
export default async function ReligionsPage() {
  const viewer = await requireViewer()
  const { active } = await getCampaignContext()
  const items = await getEntities(
    "religions",
    viewer.role,
    viewer.userId,
    active?.id ?? null
  )

  return (
    <div className={s.card}>
      <header style={{ marginBottom: "24px" }}>
        <Heading level="h1">Religions</Heading>
        <Text style={{ color: "var(--muted-foreground)", marginTop: "8px" }}>
          Deities, faiths, and belief systems of the world.
        </Text>
        <div style={{ marginTop: "16px" }}>
          <Link href="/religions/new" buttonStyle>
            New Religion
          </Link>
        </div>
      </header>

      <EntityDirectory items={items} />
    </div>
  )
}
