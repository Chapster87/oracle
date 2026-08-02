"use client"

import React from "react"
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
      <h3
        style={{
          fontWeight: "bold",
          fontSize: "24px",
          marginBottom: "16px",
          margin: "0 0 16px 0",
        }}
      >
        Welcome back
      </h3>
      <p
        style={{
          color: "var(--muted-foreground)",
          marginBottom: "32px",
          fontSize: "16px",
        }}
      >
        Explore the lore of the Shattered Isles, track your quests, and review
        the journey so far.
      </p>

      <div className={s.grid}>
        <div className={s.infoCard}>
          <h4
            style={{
              fontWeight: "bold",
              marginBottom: "8px",
              margin: "0 0 8px 0",
            }}
          >
            Latest Story Log
          </h4>
          <p
            style={{
              fontSize: "14px",
              color: "var(--muted-foreground)",
              margin: 0,
            }}
          >
            Episode 24: The Kraken's Wake
          </p>
        </div>
        <div className={s.infoCard}>
          <h4
            style={{
              fontWeight: "bold",
              marginBottom: "8px",
              margin: "0 0 8px 0",
            }}
          >
            Active Quests
          </h4>
          <p
            style={{
              fontSize: "14px",
              color: "var(--muted-foreground)",
              margin: 0,
            }}
          >
            Find the Sapphire Shard (3/4)
          </p>
        </div>
      </div>
    </div>
  )
}
