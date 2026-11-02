import React from "react"

import EntityDetailPage from "@/components/entity-detail/entity-page"

import s from "../../../style.module.css"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PlayerDetailPage({ params }: PageProps) {
  const { id } = await params

  return (
    <div className={s.card}>
      <EntityDetailPage type="players" id={id} />
    </div>
  )
}
