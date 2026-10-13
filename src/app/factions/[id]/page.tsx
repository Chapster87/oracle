import React from "react"

import EntityDetailPage from "@/components/entity-detail/entity-page"

import s from "../../style.module.css"

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ role?: string }>
}

/** Faction entity detail route. */
export default async function FactionDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params
  const { role } = await searchParams

  return (
    <div className={s.card}>
      <EntityDetailPage type="factions" id={id} roleOverride={role} />
    </div>
  )
}
