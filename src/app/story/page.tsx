import React from "react"

import Heading from "@components/heading"
import Text from "@components/text"

import StoryLog from "@/components/story-log"
import { getSession } from "@/server/session"
import { getStoryLog } from "@/server/story-log"

import s from "../style.module.css"

interface PageProps {
  searchParams: Promise<{ role?: string }>
}

/** Story Log landing: one tile per campaign log entry. */
export default async function StoryPage({ searchParams }: PageProps) {
  const { role: roleOverride } = await searchParams
  const { role, userId } = getSession(roleOverride)
  const entries = await getStoryLog(role, userId)

  return (
    <div className={s.card}>
      <header style={{ marginBottom: "24px" }}>
        <Heading level="h1">Story Log</Heading>
        <Text style={{ color: "var(--muted-foreground)", marginTop: "8px" }}>
          The chronicle of the campaign so far.
        </Text>
      </header>

      <StoryLog entries={entries} />
    </div>
  )
}
