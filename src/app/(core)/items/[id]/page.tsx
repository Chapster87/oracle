export const metadata = { title: "Item" }

import React from "react"

import EntityDetailPage from "@/components/entity-detail/entity-page"

import s from "../../../style.module.css"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ItemDetailPage({ params }: PageProps) {
  const { id } = await params

  return (
    <div className={s.card}>
      <EntityDetailPage type="items" id={id} />
    </div>
  )
}
