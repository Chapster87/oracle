"use client"

import { useState } from "react"

import Button from "@components/button"
import Heading from "@components/heading"
import { Select, SelectItem } from "@components/select"
import Text from "@components/text"
import Textarea from "@components/textarea"

import { LANES, PLAN, PROPOSALS, TRANSCRIPT } from "./data"
import { PlanDocument } from "./plan"
import { ProposalNode, ProposalPreview } from "./proposal"
import s from "../style.module.css"

/**
 * Variant C1 — right flyout review.
 * The story arc is the permanent right pane; the review rail is a flyout that
 * slides in from the right when triggered.
 */
export default function VariantC1() {
  const [lane, setLane] = useState("plan-story-arc")
  const [activeId, setActiveId] = useState(PROPOSALS[0].id)
  const [reviewOpen, setReviewOpen] = useState(false)
  const active = PROPOSALS.find((p) => p.id === activeId) ?? PROPOSALS[0]
  const activeLane = LANES.find((l) => l.id === lane) ?? LANES[0]

  const openReview = (id?: string) => {
    if (id) setActiveId(id)
    setReviewOpen(true)
  }

  return (
    <div className={s.page}>
      <div className={s.batchHeader}>
        <div>
          <Text size="sm" className={s.eyebrow}>
            Story arc · in progress
          </Text>
          <Heading level="h2" display="h4">
            {PLAN.title}
          </Heading>
          <Text size="sm" className={s.muted}>
            {PLAN.summary}
          </Text>
        </div>
        <div className={s.progress}>
          <div className={s.progressValue}>0 of 3</div>
          <Text size="sm" className={s.muted}>
            approved
          </Text>
        </div>
      </div>

      <div className={s.split}>
        <section className={s.chatPane}>
          <div className={s.chatHeader}>
            <Select
              value={lane}
              onValueChange={setLane}
              aria-label="Lane"
              className={s.lanePicker}
            >
              {LANES.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </Select>
            <Text size="sm" className={s.muted}>
              {activeLane.canPropose}
            </Text>
          </div>

          <div className={s.transcript}>
            {TRANSCRIPT.map((message, index) => (
              <div
                key={index}
                className={`${s.message} ${message.role === "user" ? s.messageUser : ""}`}
              >
                <div
                  className={`${s.bubble} ${message.role === "user" ? s.bubbleUser : ""}`}
                >
                  <Text size="sm">{message.text}</Text>
                </div>
              </div>
            ))}

            <div className={s.agentCard}>
              <div className={s.toolCall}>
                <span className={s.pulse} />
                <Text size="sm">Reading campaign context…</Text>
              </div>
              <Text size="sm" className={s.muted}>
                Drafting the arc and its three resources. Open the review flyout
                when you are ready to approve them.
              </Text>
            </div>
          </div>

          <div className={s.composer}>
            <Textarea
              rows={2}
              placeholder={`Message the ${activeLane.label} lane…`}
              className={s.composerInput}
            />
            <Button>Send</Button>
          </div>
        </section>

        <section className={s.planDoc}>
          <div className={s.planDocHeader}>
            <Text size="sm" className={s.eyebrow}>
              Story arc · draft
            </Text>
            <Button size="small" onClick={() => openReview()}>
              Review 3 proposals
            </Button>
          </div>
          <PlanDocument
            onSelectAction={(proposal) => openReview(proposal.id)}
          />
        </section>
      </div>

      {reviewOpen && (
        <>
          <div
            className={s.drawerOverlay}
            onClick={() => setReviewOpen(false)}
          />
          <aside className={s.drawer}>
            <div className={s.drawerHeader}>
              <div>
                <Text size="sm" className={s.eyebrow}>
                  Review
                </Text>
                <Heading level="h3" display="h5">
                  {PLAN.title}
                </Heading>
              </div>
              <Button
                variant="ghost"
                size="small"
                onClick={() => setReviewOpen(false)}
              >
                Close
              </Button>
            </div>
            <div className={s.railList}>
              {PROPOSALS.map((proposal) => (
                <ProposalNode
                  key={proposal.id}
                  proposal={proposal}
                  active={proposal.id === activeId}
                  onClick={() => setActiveId(proposal.id)}
                />
              ))}
            </div>
            <ProposalPreview proposal={active} />
          </aside>
        </>
      )}
    </div>
  )
}
