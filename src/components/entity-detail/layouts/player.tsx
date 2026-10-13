import React from "react"
import { TabsContent } from "@components/tabs"

import type { EntityDetailData, Player } from "@/types"

import InfoCard, { Stat } from "../info-card"
import s from "../style.module.css"

/**
 * Player character layout. Kept intentionally simple for now; richer
 * character-sheet tooling is a follow-up.
 */
export default function PlayerLayout({ data }: { data: EntityDetailData }) {
  const player = data.entity as Player

  return (
    <>
      <TabsContent value="overview">
        <div className={s.grid}>
          <InfoCard title="Background">{player.background}</InfoCard>
          <InfoCard title="Backstory">{player.backstory}</InfoCard>
        </div>
      </TabsContent>

      <TabsContent value="details">
        <InfoCard title="Stat Block">
          <dl className={s.stats}>
            <Stat label="Species" value={player.species} />
            <Stat label="Class" value={player.class_es} />
            <Stat label="Alignment" value={player.alignment} />
            <Stat
              label="Level"
              value={player.level != null ? String(player.level) : null}
            />
          </dl>
        </InfoCard>
      </TabsContent>
    </>
  )
}
