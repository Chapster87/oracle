"use client"

import React from "react"
import { ExternalLink, Pencil } from "lucide-react"

import Button from "@components/button"

import type { EntityType } from "@/types"

import ConnectDialog from "./connect-dialog"
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
  /**
   * When present, the card gains a "Connect" / "Edit" affordance. Omit it for
   * viewers who may not write (players).
   */
  connect?: { type: EntityType; id: string; name: string }
}

/**
 * The reusable D&D Beyond integration (Research #3, "Link-First"): a prominent
 * external link to a character sheet, opening in a new tab, or a "Connect D&D
 * Beyond" prompt when no link is set. Placed inside the Layered Detail tabs
 * (Research #10) for players.
 */
export default function DndBeyondLink({
  href,
  label = "Character Sheet",
  className,
  connect,
}: DndBeyondLinkProps) {
  const mark = (
    <span className={s.mark}>
      <DndBeyondMark size={28} />
    </span>
  )

  if (!href) {
    const content = (
      <>
        {mark}
        <span className={s.body}>
          <span className={s.brand}>Connect D&D Beyond</span>
          <span className={s.detail}>No {label.toLowerCase()} linked yet.</span>
        </span>
      </>
    )

    if (!connect) {
      return <div className={`${s.empty} ${className || ""}`}>{content}</div>
    }

    return (
      <ConnectDialog {...connect} label={label}>
        <Button
          unstyled
          type="button"
          className={`${s.empty} ${s.emptyButton} ${className || ""}`}
        >
          {content}
        </Button>
      </ConnectDialog>
    )
  }

  const content = (
    <>
      {mark}
      <span className={s.body}>
        <span className={s.brand}>D&D Beyond</span>
        <span className={s.detail}>{label}</span>
      </span>
      <span className={s.external}>
        <ExternalLink size={16} aria-hidden />
        <span className={s.srOnly}>Opens in a new tab</span>
      </span>
    </>
  )

  if (!connect) {
    return (
      <a
        className={`${s.link} ${className || ""}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
      </a>
    )
  }

  return (
    <div className={`${s.card} ${className || ""}`}>
      <a
        className={s.linkBody}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
      </a>
      <ConnectDialog {...connect} label={label} initialUrl={href}>
        <Button
          unstyled
          className={s.editButton}
          aria-label="Edit D&D Beyond link"
        >
          <Pencil size={16} />
        </Button>
      </ConnectDialog>
    </div>
  )
}
