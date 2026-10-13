import React from "react"
import { notFound } from "next/navigation"

import type { EntityType } from "@/types"
import { getEntity } from "@/server/entities"
import { getSession } from "@/server/session"

import EntityDetail from "./index"

interface EntityDetailPageProps {
  type: EntityType
  id: string
  roleOverride?: string
}

/**
 * Server-side assembly shared by the character/location/faction detail routes:
 * resolves the prototype session, loads the RBAC-filtered entity, and 404s when
 * it is missing or not visible to the viewer.
 */
export default async function EntityDetailPage({
  type,
  id,
  roleOverride,
}: EntityDetailPageProps) {
  const { role, userId } = getSession(roleOverride)
  const data = await getEntity(type, id, role, userId)

  if (!data) notFound()

  return <EntityDetail data={data} isDM={role === "DM"} />
}
