import React from "react"
import { TabsContent } from "@components/tabs"

import type { EntityDetailData, Faction } from "@/types"

import InfoCard from "../info-card"
import s from "../style.module.css"

/**
 * Faction specialization (Research #10): goal-heavy, with the belief system
 * given its own card in the Details tab.
 */
export default function FactionLayout({ data }: { data: EntityDetailData }) {
  const faction = data.entity as Faction

  return (
    <>
      <TabsContent value="overview">
        <InfoCard title="Overview">{faction.overview}</InfoCard>
      </TabsContent>

      <TabsContent value="details">
        <div className={s.grid}>
          <InfoCard title="Goals">{faction.goals}</InfoCard>
          <InfoCard title="Beliefs">{faction.beliefs}</InfoCard>
        </div>
      </TabsContent>
    </>
  )
}
