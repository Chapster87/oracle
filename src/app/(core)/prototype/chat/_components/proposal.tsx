"use client"

import Button from "@components/button"
import Text from "@components/text"

import type { Proposal } from "./data"
import s from "../style.module.css"

export function StatusBadge({ status }: { status: Proposal["status"] }) {
  const label =
    status === "pending"
      ? "Pending"
      : status === "promoted"
        ? "Promoted"
        : "Discarded"

  const tone =
    status === "pending"
      ? s.badgePending
      : status === "promoted"
        ? s.badgePromoted
        : s.badgeDiscarded

  return (
    <Text variant="span" size="sm" className={`${s.badge} ${tone}`}>
      {label}
    </Text>
  )
}

export function ProposalNode({
  proposal,
  active,
  onClick,
}: {
  proposal: Proposal
  active: boolean
  onClick: () => void
}) {
  return (
    <Button
      unstyled
      onClick={onClick}
      className={`${s.railNode} ${active ? s.railNodeActive : ""}`}
    >
      <div className={s.nodeIcon}>{proposal.type.slice(0, 1)}</div>
      <div className={s.nodeBody}>
        <div className={s.nodeName}>{proposal.name}</div>
        <div className={s.nodeSub}>{proposal.subtitle}</div>
      </div>
      <StatusBadge status={proposal.status} />
    </Button>
  )
}

export function ProposalPreview({ proposal }: { proposal: Proposal }) {
  return (
    <div className={s.preview}>
      <Text size="sm" className={s.previewEyebrow}>
        {proposal.type} · proposed by {proposal.lane}
      </Text>
      <div className={s.previewName}>{proposal.name}</div>
      <Text size="sm" className={s.previewSummary}>
        {proposal.summary}
      </Text>
      <div className={s.previewFields}>
        {proposal.fields.map((field) => (
          <div key={field.label}>
            <div className={s.previewLabel}>{field.label}</div>
            <div className={s.previewValue}>{field.value}</div>
          </div>
        ))}
      </div>
      <div className={s.actions}>
        <Button size="small">Approve</Button>
        <Button size="small" variant="outline">
          Edit
        </Button>
        <Button size="small" variant="ghost">
          Discard
        </Button>
      </div>
    </div>
  )
}
