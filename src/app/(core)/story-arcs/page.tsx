export const metadata = { title: "Story Arcs" }

import React from "react"

import Heading from "@components/heading"
import Link from "@components/link"
import Text from "@components/text"

import EntityDirectory from "@/components/entity-directory"
import { requireViewer } from "@/server/auth"
import { getCampaignContext } from "@/server/campaigns"
import { getEntities } from "@/server/entities"

import s from "../../style.module.css"

/** Story arc browse landing. */
export default async function StoryArcsPage() {
  const viewer = await requireViewer()
  const { active } = await getCampaignContext()
  const items = await getEntities(
    "story_arcs",
    viewer.role,
    viewer.userId,
    active?.id ?? null
  )

  return (
    <div className={s.card}>
      <header style={{ marginBottom: "24px" }}>
        <Heading level="h1">Story Arcs</Heading>
        <Text style={{ color: "var(--muted-foreground)", marginTop: "8px" }}>
          Plan the campaign&apos;s next chapters and the resources they need.
        </Text>
        <div style={{ marginTop: "16px" }}>
          <Link href="/story-arcs/new" buttonStyle>
            New Story Arc
          </Link>
        </div>
      </header>

      <EntityDirectory items={items} />
    </div>
  )
}
