import React from "react"
import { notFound } from "next/navigation"

import type { EntityType } from "@/types"
import { requireViewer } from "@/server/auth"
import { getCampaignContext } from "@/server/campaigns"
import { getEntity } from "@/server/entities"

import EntityDetail from "./index"

interface EntityDetailPageProps {
  type: EntityType
  id: string
}

/**
 * Server-side assembly shared by the entity detail routes: resolves the verified
 * viewer, loads the RBAC-filtered entity, and 404s when it is missing or not
 * visible to the viewer.
 */
export default async function EntityDetailPage({
  type,
  id,
}: EntityDetailPageProps) {
  const viewer = await requireViewer()
  const { active } = await getCampaignContext()
  const data = await getEntity(
    type,
    id,
    viewer.role,
    viewer.userId,
    active?.id ?? null
  )

  if (!data) notFound()

  return (
    <EntityDetail
      data={data}
      isDM={viewer.role === "DM" || viewer.role === "ADMIN"}
    />
  )
}
