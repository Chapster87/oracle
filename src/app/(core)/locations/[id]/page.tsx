export const metadata = { title: "Location" }

import React from "react"

import EntityDetailPage from "@/components/entity-detail/entity-page"

import s from "../../../style.module.css"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function LocationDetailPage({ params }: PageProps) {
  const { id } = await params

  return (
    <div className={s.card}>
      <EntityDetailPage type="locations" id={id} />
    </div>
  )
}
