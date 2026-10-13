import React from "react"

import type { StoryLogEntry } from "@/types"

import s from "./style.module.css"

/** Strips common markdown noise and truncates to a card-sized excerpt. */
function excerpt(content: string | null): string {
  if (!content) return ""

  const plain = content.replace(/[#*`>_]/g, "").trim()
  return plain.length > 220 ? `${plain.slice(0, 220).trimEnd()}…` : plain
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/** Tile grid of Story Log entries. Read-only for now. */
export default function StoryLog({ entries }: { entries: StoryLogEntry[] }) {
  if (entries.length === 0) {
    return <p className={s.empty}>No story log entries yet.</p>
  }

  return (
    <div className={s.grid}>
      {entries.map((entry) => (
        <article key={entry.id} className={s.tile}>
          <span className={s.date}>{formatDate(entry.created_at)}</span>
          <h3 className={s.title}>{entry.name}</h3>
          <p className={s.excerpt}>{excerpt(entry.content)}</p>
        </article>
      ))}
    </div>
  )
}
