"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"

import Button from "@components/button"
import Heading from "@components/heading"
import { Select, SelectItem } from "@components/select"
import Text from "@components/text"
import Textarea from "@components/textarea"

import type { Draft } from "@/types"

import {
  discardDraftAction,
  loadBatchAction,
  promoteDraftAction,
} from "@/server/actions/drafts"

import DraftPreview from "./draft-preview"
import PlanPanel from "./plan-panel"
import ReviewTray from "./review-tray"
import s from "../style.module.css"

interface LaneOption {
  id: string
  label: string
  description: string
}

/**
 * The C2 authoring surface: batch header, chat on the left, the active draft
 * preview on the right, and the review tray fixed to the bottom.
 */
export default function Chat({
  lanes,
  campaignName,
}: {
  lanes: LaneOption[]
  campaignName: string | null
}) {
  const [laneId, setLaneId] = useState(lanes[0]?.id ?? "general")
  const [input, setInput] = useState("")
  const [batchId, setBatchId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [trayOpen, setTrayOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/agent", body: { laneId } }),
    [laneId]
  )

  const { messages, sendMessage, status, error } = useChat({ transport })

  const activeLane = lanes.find((lane) => lane.id === laneId) ?? lanes[0]

  const { latestBatchId, proposalCount } = useMemo(() => {
    let batch: string | null = null
    let count = 0

    for (const message of messages) {
      for (const part of message.parts ?? []) {
        if (
          part.type === "tool-propose_record" &&
          part.state === "output-available"
        ) {
          count += 1
          const output = part.output as { batchId?: string } | undefined
          if (output?.batchId) batch = output.batchId
        }
      }
    }

    return { latestBatchId: batch, proposalCount: count }
  }, [messages])

  const load = (id: string) => {
    startTransition(async () => {
      const result = await loadBatchAction(id)
      if (!result) return
      setDrafts(result.drafts)
      setActiveId((current) => current ?? result.drafts[0]?.id ?? null)
    })
  }

  useEffect(() => {
    if (latestBatchId) {
      setBatchId(latestBatchId)
      load(latestBatchId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestBatchId, proposalCount])

  const active =
    drafts.find((draft) => draft.id === activeId) ?? drafts[0] ?? null
  const planDraft = drafts.find((draft) => draft.model === "story_arcs") ?? null
  const resourceDrafts = drafts.filter((draft) => draft.model !== "story_arcs")
  const approved = resourceDrafts.filter(
    (draft) => draft.status === "promoted"
  ).length

  const submit = () => {
    const text = input.trim()
    if (!text) return
    setInput("")
    sendMessage({ text })
  }

  const promote = () => {
    if (!active) return
    startTransition(async () => {
      const result = await promoteDraftAction(active.id)
      if (result.ok && batchId) load(batchId)
    })
  }

  const discard = () => {
    if (!active) return
    startTransition(async () => {
      const result = await discardDraftAction(active.id)
      if (result.ok && batchId) load(batchId)
    })
  }

  return (
    <div className={s.page}>
      <div className={s.batchHeader}>
        <div>
          <Text size="sm" className={s.eyebrow}>
            Authoring batch
          </Text>
          <Heading level="h1" display="h4">
            {activeLane?.label ?? "Chat"}
          </Heading>
          <Text size="sm" className={s.muted}>
            {campaignName ? `Campaign: ${campaignName}` : "No active campaign"}
          </Text>
        </div>
        <div className={s.progress}>
          <div className={s.progressValue}>
            {approved} of {resourceDrafts.length}
          </div>
          <Text size="sm" className={s.muted}>
            approved
          </Text>
        </div>
      </div>

      <div className={s.split}>
        <section className={s.chatPane}>
          <div className={s.chatHeader}>
            <Select
              value={laneId}
              onValueChange={setLaneId}
              aria-label="Lane"
              className={s.lanePicker}
            >
              {lanes.map((lane) => (
                <SelectItem key={lane.id} value={lane.id}>
                  {lane.label}
                </SelectItem>
              ))}
            </Select>
            <Text size="sm" className={s.muted}>
              {activeLane?.description}
            </Text>
          </div>

          <div className={s.transcript}>
            {messages.length === 0 && (
              <div className={s.empty}>
                <Text size="sm" className={s.muted}>
                  Tag a lane and describe what you want to create. The agent
                  proposes drafts; nothing is written until you approve.
                </Text>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`${s.message} ${message.role === "user" ? s.messageUser : ""}`}
              >
                <div
                  className={`${s.bubble} ${message.role === "user" ? s.bubbleUser : ""}`}
                >
                  {message.parts.map((part, index) => {
                    if (part.type === "text") {
                      return (
                        <Text key={index} size="sm">
                          {part.text}
                        </Text>
                      )
                    }

                    if (part.type === "tool-propose_record") {
                      const output = part.output as
                        { error?: string } | undefined

                      return (
                        <Text
                          key={index}
                          size="sm"
                          className={output?.error ? s.error : s.toolCall}
                        >
                          {part.state === "output-available"
                            ? (output?.error ?? "Proposed a draft.")
                            : "Proposing a draft…"}
                        </Text>
                      )
                    }

                    return null
                  })}
                </div>
              </div>
            ))}

            {status === "streaming" && (
              <div className={s.toolCall}>
                <span className={s.pulse} />
                <Text size="sm">The agent is working…</Text>
              </div>
            )}

            {error && (
              <Text size="sm" className={s.error}>
                {error.message}
              </Text>
            )}
          </div>

          <div className={s.composer}>
            <Textarea
              rows={2}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={`Message the ${activeLane?.label ?? "General"} lane…`}
              className={s.composerInput}
            />
            <Button
              onClick={submit}
              disabled={status === "streaming" || !input.trim()}
            >
              Send
            </Button>
          </div>
        </section>

        <aside className={s.previewPane}>
          {planDraft ? (
            <PlanPanel
              plan={planDraft}
              drafts={drafts}
              activeId={activeId}
              onSelect={setActiveId}
              approved={approved}
              total={resourceDrafts.length}
            />
          ) : active ? (
            <>
              <div className={s.previewPaneHeader}>
                <Text size="sm" className={s.eyebrow}>
                  Preview
                </Text>
                <Text size="sm" className={s.muted}>
                  {active.model} · {active.status}
                </Text>
              </div>
              <DraftPreview draft={active} />
            </>
          ) : (
            <div className={s.emptyPreview}>
              <Text size="sm" className={s.muted}>
                Proposals appear here for review. Nothing is written until you
                approve.
              </Text>
            </div>
          )}
        </aside>
      </div>

      {drafts.length > 0 && (
        <ReviewTray
          drafts={drafts}
          activeId={activeId}
          onSelect={setActiveId}
          open={trayOpen}
          onToggle={() => setTrayOpen((value) => !value)}
          onPromote={promote}
          onDiscard={discard}
          onSaved={() => batchId && load(batchId)}
          pending={pending}
        />
      )}
    </div>
  )
}
