import React from "react"

import Heading from "@components/heading"
import Text from "@components/text"

import StoryLog from "@/components/story-log"
import { requireViewer } from "@/server/auth"
import { getStoryLog } from "@/server/story-log"

import s from "../../style.module.css"

/** Story Log landing: one tile per campaign log entry. */
export default async function StoryPage() {
  const viewer = await requireViewer()
  const entries = await getStoryLog(viewer.role, viewer.userId)

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
