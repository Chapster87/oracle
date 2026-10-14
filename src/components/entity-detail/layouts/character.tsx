import React from "react"
import { TabsContent } from "@components/tabs"
import DndBeyondLink, { dndBeyondUrl } from "@components/dnd-beyond"

import type { Character, EntityDetailData } from "@/types"

import InfoCard, { Stat } from "../info-card"
import s from "../style.module.css"

/**
 * Character specialization (Research #10): narrative-first Overview, with the
 * stat block pushed into the Details tab.
 */
export default function CharacterLayout({ data }: { data: EntityDetailData }) {
  const character = data.entity as Character

  return (
    <>
      <TabsContent value="overview">
        <div className={s.grid}>
          <DndBeyondLink
            href={dndBeyondUrl(character)}
            label="Character Sheet"
          />
          <InfoCard title="Appearance">{character.appearance}</InfoCard>
          <InfoCard title="Personality">{character.personality}</InfoCard>
          <InfoCard title="Role">{character.role}</InfoCard>
        </div>
      </TabsContent>

      <TabsContent value="details">
        <InfoCard title="Stat Block">
          <dl className={s.stats}>
            <Stat label="Species" value={character.species} />
            <Stat label="Class" value={character.class} />
            <Stat label="Alignment" value={character.alignment} />
            <Stat
              label="Status"
              value={character.is_deceased ? "Deceased" : "Alive"}
            />
          </dl>
        </InfoCard>
      </TabsContent>
    </>
  )
}
