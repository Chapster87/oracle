"use client"

import Button from "@components/button"

import type { Draft } from "@/types"

import DraftEditor from "./draft-editor"
import s from "../style.module.css"

/**
 * The C2 review tray: a fixed bottom bar with a node per draft, expanding to
 * the active draft's editor and approval actions.
 */
export default function ReviewTray({
  drafts,
  activeId,
  onSelect,
  open,
  onToggle,
  onPromote,
  onDiscard,
  onSaved,
  pending,
}: {
  drafts: Draft[]
  activeId: string | null
  onSelect: (id: string) => void
  open: boolean
  onToggle: () => void
  onPromote: () => void
  onDiscard: () => void
  onSaved: () => void
  pending: boolean
}) {
  const active =
    drafts.find((draft) => draft.id === activeId) ?? drafts[0] ?? null

  return (
    <div className={s.trayFixed}>
      {open && active && (
        <div className={s.trayDetail}>
          <DraftEditor draft={active} onSaved={onSaved} />
          <div className={s.trayActions}>
            <Button size="small" onClick={onPromote} disabled={pending}>
              Approve
            </Button>
            <Button
              size="small"
              variant="outline"
              onClick={onDiscard}
              disabled={pending}
            >
              Discard
            </Button>
          </div>
        </div>
      )}

      <div className={s.trayBar}>
        <div className={s.trayNodes}>
          {drafts.map((draft) => (
            <Button
              key={draft.id}
              unstyled
              className={`${s.trayNode} ${draft.id === activeId ? s.trayNodeActive : ""}`}
              onClick={() => onSelect(draft.id)}
            >
              <div className={s.nodeIcon}>
                {String(draft.model).slice(0, 1).toUpperCase()}
              </div>
              <div className={s.trayNodeBody}>
                <div className={s.nodeName}>
                  {String(draft.payload.name ?? "Untitled")}
                </div>
                <div className={s.nodeSub}>
                  {draft.model} · {draft.status}
                </div>
              </div>
            </Button>
          ))}
        </div>
        <Button size="small" variant="outline" onClick={onToggle}>
          {open ? "Collapse" : `Review ${drafts.length}`}
        </Button>
      </div>
    </div>
  )
}
