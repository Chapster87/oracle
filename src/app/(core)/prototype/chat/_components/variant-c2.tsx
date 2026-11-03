"use client"

import { useState } from "react"

import Button from "@components/button"
import Heading from "@components/heading"
import { Select, SelectItem } from "@components/select"
import Text from "@components/text"
import Textarea from "@components/textarea"

import { LANES, PLAN, PROPOSALS, TRANSCRIPT } from "./data"
import { PlanDocument } from "./plan"
import { ProposalPreview, StatusBadge } from "./proposal"
import s from "../style.module.css"

/**
 * Variant C2 — fixed bottom review panel.
 * A viewport-bottom tray previews each proposal; expanding it shows the active
 * node's details above the tray.
 */
export default function VariantC2() {
  const [lane, setLane] = useState("plan-story-arc")
  const [activeId, setActiveId] = useState(PROPOSALS[0].id)
  const [trayOpen, setTrayOpen] = useState(false)
  const active = PROPOSALS.find((p) => p.id === activeId) ?? PROPOSALS[0]
  const activeLane = LANES.find((l) => l.id === lane) ?? LANES[0]

  const openReview = (id?: string) => {
    if (id) setActiveId(id)
    setTrayOpen(true)
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
                Drafting the arc and its three resources. They appear in the
                review tray along the bottom.
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

      <div className={s.trayFixed}>
        {trayOpen && (
          <div className={s.trayDetail}>
            <ProposalPreview proposal={active} />
          </div>
        )}

        <div className={s.trayBar}>
          <div className={s.trayNodes}>
            {PROPOSALS.map((proposal) => (
              <Button
                key={proposal.id}
                unstyled
                className={`${s.trayNode} ${proposal.id === activeId ? s.trayNodeActive : ""}`}
                onClick={() => openReview(proposal.id)}
              >
                <div className={s.nodeIcon}>{proposal.type.slice(0, 1)}</div>
                <div className={s.trayNodeBody}>
                  <div className={s.nodeName}>{proposal.name}</div>
                  <div className={s.nodeSub}>{proposal.subtitle}</div>
                </div>
                <StatusBadge status={proposal.status} />
              </Button>
            ))}
          </div>
          <Button
            size="small"
            variant="outline"
            onClick={() => setTrayOpen((value) => !value)}
          >
            {trayOpen ? "Collapse" : "Review 3 proposals"}
          </Button>
        </div>
      </div>
    </div>
  )
}
