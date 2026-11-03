"use client"

import { useState } from "react"

import Button from "@components/button"
import Heading from "@components/heading"
import { Select, SelectItem } from "@components/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/tabs"
import Text from "@components/text"
import Textarea from "@components/textarea"

import { LANES, PLAN, PROPOSALS, TRANSCRIPT } from "./data"
import { PlanDocument } from "./plan"
import { ProposalNode, ProposalPreview } from "./proposal"
import s from "../style.module.css"

/**
 * Variant C — tabbed right panel.
 * Chat on the left; the right pane switches between the story arc and the
 * review rail.
 */
export default function VariantC() {
  const [lane, setLane] = useState("plan-story-arc")
  const [activeId, setActiveId] = useState(PROPOSALS[0].id)
  const active = PROPOSALS.find((p) => p.id === activeId) ?? PROPOSALS[0]
  const activeLane = LANES.find((l) => l.id === lane) ?? LANES[0]

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
                Story arc tab as they are proposed.
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

        <aside className={s.railPane}>
          <Tabs defaultValue="arc" className={s.tabsFill}>
            <TabsList>
              <TabsTrigger value="arc">Story arc</TabsTrigger>
              <TabsTrigger value="review">Review</TabsTrigger>
            </TabsList>
            <TabsContent value="arc" className={s.tabContent}>
              <PlanDocument
                onSelectAction={(proposal) => setActiveId(proposal.id)}
              />
            </TabsContent>
            <TabsContent value="review" className={s.tabContent}>
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
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  )
}
