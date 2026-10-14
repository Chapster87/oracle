import React from "react"
import { ExternalLink } from "lucide-react"

import DndBeyondMark from "./mark"
import s from "./style.module.css"

/**
 * Reads the D&D Beyond URL recorded in an entity's `metadata` (the `ddb_url`
 * key). Returns `null` when it is missing or not a usable string, which drives
 * the component's empty state.
 */
export function dndBeyondUrl(entity: {
  metadata?: Record<string, any>
}): string | null {
  const url = entity.metadata?.ddb_url
  return typeof url === "string" && url.trim() ? url.trim() : null
}

interface DndBeyondLinkProps {
  /** Destination on D&D Beyond. When absent, the "Connect" prompt is rendered. */
  href?: string | null
  /** What the link points at, e.g. "Character Sheet" or "Encounter". */
  label?: string
  className?: string
}

/**
 * The reusable D&D Beyond integration (Research #3, "Link-First"): a prominent
 * external link to a character sheet or encounter page, opening in a new tab,
 * or a "Connect D&D Beyond" prompt when no link is set. Placed inside the
 * Layered Detail tabs (Research #10) for characters and locations.
 */
export default function DndBeyondLink({
  href,
  label = "Character Sheet",
  className,
}: DndBeyondLinkProps) {
  if (!href) {
    return (
      <div className={`${s.empty} ${className || ""}`}>
        <span className={s.mark}>
          <DndBeyondMark size={28} />
        </span>
        <span className={s.body}>
          <span className={s.brand}>Connect D&D Beyond</span>
          <span className={s.detail}>
            No {label.toLowerCase()} linked yet.
          </span>
        </span>
      </div>
    )
  }

  return (
    <a
      className={`${s.link} ${className || ""}`}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className={s.mark}>
        <DndBeyondMark size={28} />
      </span>
      <span className={s.body}>
        <span className={s.brand}>D&D Beyond</span>
        <span className={s.detail}>{label}</span>
      </span>
      <span className={s.external}>
        <ExternalLink size={16} aria-hidden />
        <span className={s.srOnly}>Opens in a new tab</span>
      </span>
    </a>
  )
}
