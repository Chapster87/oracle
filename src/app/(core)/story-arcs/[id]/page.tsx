export const metadata = { title: "Story Arc" }

import React from "react"

import EntityDetailPage from "@/components/entity-detail/entity-page"

import s from "../../../style.module.css"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function StoryArcDetailPage({ params }: PageProps) {
  const { id } = await params

  return (
    <div className={s.card}>
      <EntityDetailPage type="story_arcs" id={id} />
    </div>
  )
}
