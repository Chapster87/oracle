"use client"

import Button from "@components/button"
import Heading from "@components/heading"
import Markdown from "@components/markdown"
import Text from "@components/text"

import type { Draft } from "@/types"

import s from "../style.module.css"

interface ResourceRef {
  name: string
  type: string
}

/**
 * The running log of the arc being planned: the plan document, its needed
 * resources as inline review cards, and the approval progress.
 */
export default function PlanPanel({
  plan,
  drafts,
  activeId,
  onSelect,
  approved,
  total,
}: {
  plan: Draft
  drafts: Draft[]
  activeId: string | null
  onSelect: (id: string) => void
  approved: number
  total: number
}) {
  const payload = plan.payload as Record<string, unknown>
  const overview = String(payload.overview ?? "")
  const content = String(payload.content ?? "")
  const needed = payload.needed_resources as
    { major?: ResourceRef[]; minor?: ResourceRef[] } | undefined
  const resources = [...(needed?.major ?? []), ...(needed?.minor ?? [])]
  const resourceDrafts = drafts.filter((draft) => draft.model !== "story_arcs")

  return (
    <div className={s.planPanel}>
      <div className={s.planPanelHeader}>
        <div>
          <Text size="sm" className={s.eyebrow}>
            Story arc · draft
          </Text>
          <Heading level="h2" display="h4">
            {String(payload.name ?? "Untitled arc")}
          </Heading>
          <Text size="sm" className={s.muted}>
            {overview}
          </Text>
        </div>
        <div className={s.progress}>
          <div className={s.progressValue}>
            {approved} of {total}
          </div>
          <Text size="sm" className={s.muted}>
            approved
          </Text>
        </div>
      </div>

      <div className={s.planBody}>
        <section className={s.planSection}>
          <Heading level="h3" display="h6">
            Overview
          </Heading>
          <Text size="sm">{overview || "No overview yet."}</Text>
        </section>

        <section className={s.planSection}>
          <Heading level="h3" display="h6">
            Needed resources
          </Heading>
          {resources.length === 0 && (
            <Text size="sm" className={s.muted}>
              No resources listed yet.
            </Text>
          )}

          {resources.map((resource) => {
            const draft = resourceDrafts.find(
              (candidate) =>
                String(candidate.payload.name ?? "") === resource.name
            )

            return (
              <div key={resource.name} className={s.inlineProposal}>
                <div className={s.inlineProposalHeader}>
                  <div>
                    <div className={s.nodeName}>{resource.name}</div>
                    <div className={s.nodeSub}>{resource.type}</div>
                  </div>
                  <Text size="sm" className={s.muted}>
                    {draft?.status ?? "pending"}
                  </Text>
                </div>

                {draft && (
                  <Text size="sm" className={s.muted}>
                    {String(
                      draft.payload.overview ??
                        draft.payload.description ??
                        draft.payload.personality ??
                        ""
                    )}
                  </Text>
                )}

                <div className={s.actions}>
                  <Button
                    size="small"
                    disabled={!draft}
                    onClick={() => draft && onSelect(draft.id)}
                  >
                    Review
                  </Button>
                </div>
              </div>
            )
          })}
        </section>

        {content && (
          <section className={s.planSection}>
            <Heading level="h3" display="h6">
              Plan document
            </Heading>
            <Markdown>{content}</Markdown>
          </section>
        )}
      </div>
    </div>
  )
}
