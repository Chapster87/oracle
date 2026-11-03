"use client"

import Button from "@components/button"
import Heading from "@components/heading"
import Text from "@components/text"

import { PLAN, PROPOSALS, type Proposal } from "./data"
import { StatusBadge } from "./proposal"
import s from "../style.module.css"

/**
 * The story arc document, with its proposed resources marked inline. Shared
 * content for the A-shaped variants; the surrounding layout is each variant's
 * own.
 */
export function PlanDocument({
  onSelectAction,
  compact = false,
}: {
  onSelectAction: (proposal: Proposal) => void
  compact?: boolean
}) {
  return (
    <div className={compact ? s.planCompact : s.planBody}>
      <Text size="sm" className={s.eyebrow}>
        Story arc · draft
      </Text>
      <Heading level="h2" display={compact ? "h6" : "h4"}>
        {PLAN.title}
      </Heading>
      <Text size="sm" className={s.muted}>
        {PLAN.summary}
      </Text>

      <div className={s.planSection}>
        <Heading level="h3" display="h6">
          Overview
        </Heading>
        <Text size="sm">
          The last ember of a dead god is hidden in a blacksmith&apos;s forge. A
          debt collector arrives to claim it, and the order that guards it must
          decide whether to burn the town or let the ember die.
        </Text>
      </div>

      <div className={s.planSection}>
        <Heading level="h3" display="h6">
          Needed resources
        </Heading>
        {PROPOSALS.map((proposal) => (
          <div key={proposal.id} className={s.inlineProposal}>
            <div className={s.inlineProposalHeader}>
              <div>
                <div className={s.nodeName}>{proposal.name}</div>
                <div className={s.nodeSub}>{proposal.subtitle}</div>
              </div>
              <StatusBadge status={proposal.status} />
            </div>
            {!compact && (
              <Text size="sm" className={s.muted}>
                {proposal.summary}
              </Text>
            )}
            <div className={s.actions}>
              <Button size="small" onClick={() => onSelectAction(proposal)}>
                Review
              </Button>
            </div>
          </div>
        ))}
      </div>

      {!compact && (
        <div className={s.planSection}>
          <Heading level="h3" display="h6">
            Session breakdown
          </Heading>
          <Text size="sm">
            Session 1 — The debt collector arrives. Session 2 — The order
            reveals itself. Session 3 — The ember chooses.
          </Text>
        </div>
      )}
    </div>
  )
}
