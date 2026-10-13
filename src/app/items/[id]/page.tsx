import React from "react"

import EntityDetailPage from "@/components/entity-detail/entity-page"

import s from "../../style.module.css"

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ role?: string }>
}

/** Item detail route. */
export default async function ItemDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params
  const { role } = await searchParams

  return (
    <div className={s.card}>
      <EntityDetailPage type="items" id={id} roleOverride={role} />
    </div>
  )
}
