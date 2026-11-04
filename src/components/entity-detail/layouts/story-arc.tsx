import React from "react"
import { TabsContent } from "@components/tabs"

import type { EntityDetailData, StoryArc } from "@/types"

import InfoCard, { Stat } from "../info-card"
import s from "../style.module.css"

interface ResourceRef {
  id?: string
  name: string
  type: string
}

function ResourceList({ resources }: { resources?: ResourceRef[] }) {
  if (!resources || resources.length === 0) return null

  return (
    <ul className={s.list}>
      {resources.map((resource) => (
        <li key={resource.id ?? resource.name}>
          {resource.name} <span className={s.empty}>({resource.type})</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * Story arc specialization: the plan document, its status, and the resources
 * it expects to manifest.
 */
export default function StoryArcLayout({ data }: { data: EntityDetailData }) {
  const arc = data.entity as StoryArc
  const needed = arc.needed_resources ?? {}

  return (
    <>
      <TabsContent value="overview">
        <div className={s.grid}>
          <InfoCard title="Overview">{arc.overview}</InfoCard>
          <InfoCard title="Needed Resources">
            <ResourceList resources={needed.major} />
            <ResourceList resources={needed.minor} />
          </InfoCard>
        </div>
        <div className={s.planSection}>
          <InfoCard title="Plan Document">{arc.content}</InfoCard>
        </div>
      </TabsContent>

      <TabsContent value="details">
        <div className={s.grid}>
          <InfoCard title="Plan">
            <dl className={s.stats}>
              <Stat label="Status" value={arc.status} />
              <Stat label="Target Level" value={arc.target_level} />
              <Stat
                label="Sessions"
                value={arc.session_count?.toString() ?? null}
              />
            </dl>
          </InfoCard>
        </div>
      </TabsContent>
    </>
  )
}
