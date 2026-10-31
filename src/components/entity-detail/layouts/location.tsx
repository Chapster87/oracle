import React from "react"
import { TabsContent } from "@components/tabs"

import type { EntityDetailData, Location } from "@/types"

import InfoCard from "../info-card"
import s from "../style.module.css"

function renderPointOfInterest(point: unknown): string {
  if (typeof point === "string") return point
  if (point && typeof point === "object" && "name" in point) {
    return String((point as { name: unknown }).name)
  }
  return JSON.stringify(point)
}

/**
 * Location specialization (Research #10): interaction-heavy, surfacing
 * inhabitants and points of interest alongside the descriptive lore.
 */
export default function LocationLayout({ data }: { data: EntityDetailData }) {
  const location = data.entity as Location
  const pointsOfInterest = Array.isArray(location.points_of_interest)
    ? location.points_of_interest
    : []

  return (
    <>
      <TabsContent value="overview">
        <div className={s.grid}>
          <InfoCard title="Overview">{location.overview}</InfoCard>
          <InfoCard title="Inhabitants">{location.inhabitants}</InfoCard>
        </div>
      </TabsContent>

      <TabsContent value="details">
        <div className={s.grid}>
          <InfoCard title="History">{location.history}</InfoCard>

          <InfoCard title="Points of Interest">
            {pointsOfInterest.length > 0 ? (
              <ul className={s.list}>
                {pointsOfInterest.map((point, index) => (
                  <li key={index}>{renderPointOfInterest(point)}</li>
                ))}
              </ul>
            ) : null}
          </InfoCard>

          <InfoCard title="Map">
            {location.map_data ? (
              <div className={s.mapPlaceholder}>
                Map data available — preview coming soon.
              </div>
            ) : null}
          </InfoCard>
        </div>
      </TabsContent>
    </>
  )
}
