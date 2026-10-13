import React from "react"
import { TabsContent } from "@components/tabs"

import type { EntityDetailData, Item } from "@/types"

import InfoCard, { Stat } from "../info-card"
import s from "../style.module.css"

/** Item layout: description-first, with classification and history in Details. */
export default function ItemLayout({ data }: { data: EntityDetailData }) {
  const item = data.entity as Item

  return (
    <>
      <TabsContent value="overview">
        <InfoCard title="Description">{item.description}</InfoCard>
      </TabsContent>

      <TabsContent value="details">
        <div className={s.grid}>
          <InfoCard title="Classification">
            <dl className={s.stats}>
              <Stat label="Type" value={item.type} />
              <Stat label="Rarity" value={item.rarity} />
            </dl>
          </InfoCard>
          <InfoCard title="History">{item.history}</InfoCard>
          <InfoCard title="Role in Campaign">{item.role_in_campaign}</InfoCard>
        </div>
      </TabsContent>
    </>
  )
}
