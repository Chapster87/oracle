"use client"

import React from "react"

import Heading from "@components/heading"
import Link from "@components/link"
import Text from "@components/text"

import s from "../style.module.css"
import d from "./home.module.css"

const QUESTS = [
  {
    name: "Find the Sapphire Shard",
    status: "In the Thick of It",
    tone: "statusThick",
  },
  { name: "Escort the Merchant", status: "Whispers", tone: "statusWhispers" },
  {
    name: "Restore the Old Tower",
    status: "Completed",
    tone: "statusCompleted",
  },
  {
    name: "Explore the Sunken Crypt",
    status: "Dormant",
    tone: "statusDormant",
  },
] as const

const EPISODES = [
  {
    title: "Episode 24: The Kraken's Wake",
    summary: "The party narrowly escaped the depths...",
  },
  {
    title: "Episode 23: Whispers in the Dark",
    summary: "Investigating the tavern rumors...",
  },
]

/**
 * The campaign home. Absorbs the old dashboard: a welcome band over the quest
 * tracker, the recent chronicle, and the roster/map shortcuts.
 */
export default function HomePage() {
  return (
    <div className={s.card}>
      <Heading level="h2" display="h3" style={{ margin: "0 0 8px 0" }}>
        Welcome back
      </Heading>
      <Text style={{ color: "var(--muted-foreground)", margin: 0 }}>
        Explore the lore of the Shattered Isles, track your quests, and review
        the journey so far.
      </Text>

      <div className={d.grid}>
        <div className={d.card}>
          <div className={d.cardTitle}>
            <span>Quests</span>
          </div>

          {QUESTS.map((quest) => (
            <div key={quest.name} className={d.widgetItem}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span>{quest.name}</span>
                <span className={`${d.statusBadge} ${d[quest.tone]}`}>
                  {quest.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className={d.card}>
          <div className={d.cardTitle}>
            <span>Recent Episodes</span>
            <Link href="/story" className={d.link}>
              See All Episodes
            </Link>
          </div>

          {EPISODES.map((episode) => (
            <div key={episode.title} className={d.widgetItem}>
              <strong>{episode.title}</strong>
              <Text
                size="sm"
                style={{ color: "var(--muted-foreground)", marginTop: "4px" }}
              >
                {episode.summary}
              </Text>
            </div>
          ))}
        </div>

        <div className={d.card}>
          <div className={d.cardTitle}>
            <span>Roster &amp; Map</span>
          </div>
          <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
            <Link href="/characters" className={d.link}>
              View Characters
            </Link>
            <Link href="/world" className={d.link}>
              View Map
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
