import React from "react"

import { hasContent } from "./has-content"
import s from "./style.module.css"

interface InfoCardProps {
  title: string
  children?: React.ReactNode
}

/**
 * A labelled content card used for the entity-specific detail fields.
 * Renders an empty state when no content is supplied.
 */
export default function InfoCard({ title, children }: InfoCardProps) {
  return (
    <section className={s.infoCard}>
      <h3 className={s.infoCardTitle}>{title}</h3>
      <div className={s.infoCardBody}>
        {hasContent(children) ? (
          children
        ) : (
          <span className={s.empty}>No information recorded.</span>
        )}
      </div>
    </section>
  )
}

/** A single label/value pair, used inside a stat block. */
export function Stat({
  label,
  value,
}: {
  label: string
  value?: string | null
}) {
  return (
    <div className={s.stat}>
      <dt className={s.statLabel}>{label}</dt>
      <dd className={s.statValue}>{value || "—"}</dd>
    </div>
  )
}
