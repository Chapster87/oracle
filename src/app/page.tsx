"use client"

import React from "react"

import Heading from "@components/heading"
import Text from "@components/text"

import s from "./style.module.css"

/**
 * Homepage content for the Oracle DM Assistant.
 * Uses the shared layout defined in layout.tsx.
 */
export default function HomePage() {
  // We can't access the role state from RootLayout here directly without Context,
  // but for now, we'll just render the static content part of the homepage.
  // Ideally, we'd use a Context Provider if we need to react to role changes here.
  // For the prototype, we'll keep it simple.

  return (
    <div className={s.card}>
      <Heading level="h3" style={{ margin: "0 0 16px 0" }}>
        Welcome back
      </Heading>
      <Text
        style={{
          color: "var(--muted-foreground)",
          marginBottom: "32px",
        }}
      >
        Explore the lore of the Shattered Isles, track your quests, and review
        the journey so far.
      </Text>

      <div className={s.grid}>
        <div className={s.infoCard}>
          <Heading level="h4" style={{ margin: "0 0 8px 0" }}>
            Latest Story Log
          </Heading>
          <Text
            size="sm"
            style={{
              color: "var(--muted-foreground)",
              margin: 0,
            }}
          >
            Episode 24: The Kraken's Wake
          </Text>
        </div>
        <div className={s.infoCard}>
          <Heading level="h4" style={{ margin: "0 0 8px 0" }}>
            Active Quests
          </Heading>
          <Text
            size="sm"
            style={{
              color: "var(--muted-foreground)",
              margin: 0,
            }}
          >
            Find the Sapphire Shard (3/4)
          </Text>
        </div>
      </div>
    </div>
  )
}
