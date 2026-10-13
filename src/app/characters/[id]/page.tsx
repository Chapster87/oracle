import React from "react"

import EntityDetailPage from "@/components/entity-detail/entity-page"

import s from "../../style.module.css"

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ role?: string }>
}

/** Character entity detail route. */
export default async function CharacterDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params
  const { role } = await searchParams

  return (
    <div className={s.card}>
      <EntityDetailPage type="characters" id={id} roleOverride={role} />
    </div>
  )
}
