import React from "react"
import { TabsContent } from "@components/tabs"

import type { EntityDetailData, Religion } from "@/types"

import InfoCard from "../info-card"
import s from "../style.module.css"

/** Religion layout: overview-first, with beliefs and practice in Details. */
export default function ReligionLayout({ data }: { data: EntityDetailData }) {
  const religion = data.entity as Religion

  return (
    <>
      <TabsContent value="overview">
        <InfoCard title="Overview">{religion.overview}</InfoCard>
      </TabsContent>

      <TabsContent value="details">
        <div className={s.grid}>
          <InfoCard title="Domains & Teachings">
            {religion.domains_teachings}
          </InfoCard>
          <InfoCard title="Worship & Rituals">
            {religion.worship_rituals}
          </InfoCard>
          <InfoCard title="Clergy & Followers">
            {religion.clergy_followers}
          </InfoCard>
          <InfoCard title="History & Myths">{religion.history_myths}</InfoCard>
          <InfoCard title="Role in Campaign">
            {religion.role_in_campaign}
          </InfoCard>
        </div>
      </TabsContent>
    </>
  )
}
