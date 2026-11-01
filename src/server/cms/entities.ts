import type { EntityType, Visibility, WriteResult } from "@/types"
import { isEntityType } from "@/utils/entity"

import { ENTITY_SCHEMAS } from "@/schemas/registry"

import type { Viewer } from "../rbac"
import { canWrite } from "../rbac"
import type { Session } from "../session"
import { supabaseAdmin } from "../supabase"

export type { WriteResult }

interface DbError {
  code?: string
  message: string
}

/** The scope columns every entity row carries, plus its concurrency token. */
export interface EntityScopeRow {
  id: string
  campaign_id: string | null
  owner_id: string | null
  visibility: Visibility
  updated_at: string
}

/** Loads the columns needed to authorize a write against an entity. */
export async function loadEntityScope(
  type: EntityType,
  id: string
): Promise<EntityScopeRow | null> {
  const { data, error } = await supabaseAdmin
    .from(type)
    .select("id, campaign_id, owner_id, visibility, updated_at")
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  return (data as EntityScopeRow | null) ?? null
}

/** Whether the viewer may write this entity, per the canonical predicate. */
export async function canWriteEntity(
  type: EntityType,
  id: string,
  viewer: Viewer
): Promise<boolean> {
  const scope = await loadEntityScope(type, id)
  if (!scope) return false

  const roles = await campaignRoles(viewer.userId, scope.campaign_id)

  return canWrite(
    viewer,
    {
      campaignId: scope.campaign_id,
      ownerId: scope.owner_id,
      visibility: scope.visibility,
    },
    () => roles.dm
  )
}

/** Whether the viewer runs a campaign, and whether they belong to it at all. */
async function campaignRoles(
  userId: string,
  campaignId: string | null
): Promise<{ dm: boolean; member: boolean }> {
  if (!campaignId) return { dm: false, member: false }

  const [{ data: campaign }, { data: membership }] = await Promise.all([
    supabaseAdmin
      .from("campaigns")
      .select("owner_id")
      .eq("id", campaignId)
      .maybeSingle(),
    supabaseAdmin
      .from("campaign_members")
      .select("role")
      .eq("campaign_id", campaignId)
      .eq("user_id", userId)
      .maybeSingle(),
  ])

  const isOwner = campaign?.owner_id === userId

  return {
    dm: isOwner || membership?.role === "DM",
    member: isOwner || membership !== null,
  }
}

function validationResult(error: {
  issues: { path: PropertyKey[]; message: string }[]
}): WriteResult {
  const fieldErrors: Record<string, string[]> = {}

  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form"
    ;(fieldErrors[key] ??= []).push(issue.message)
  }

  return {
    ok: false,
    code: "validation",
    fieldErrors,
    formError: "Please fix the highlighted fields.",
  }
}

function mapDbError(error: DbError): WriteResult {
  if (error.code === "PT409") {
    return {
      ok: false,
      code: "conflict",
      formError: "Someone else changed this entity. Reload and try again.",
    }
  }

  if (error.code === "23505") {
    return {
      ok: false,
      code: "constraint",
      fieldErrors: { name: ["An entity with that name already exists here."] },
    }
  }

  if (error.code === "22023") {
    return { ok: false, code: "validation", formError: error.message }
  }

  throw error
}

/**
 * Creates an entity in its registry row and its specialized table, atomically.
 * The actor owns what they create; `visibility` defaults to `private` in SQL.
 */
export async function createEntity(
  type: EntityType,
  payload: Record<string, unknown>,
  viewer: Viewer
): Promise<WriteResult> {
  if (!isEntityType(type)) {
    return { ok: false, code: "validation", formError: "Unknown entity type." }
  }

  const parsed = ENTITY_SCHEMAS[type].create.safeParse(payload)
  if (!parsed.success) return validationResult(parsed.error)

  const data = parsed.data as Record<string, unknown>
  const campaignId = (data.campaign_id as string | null | undefined) ?? null

  const roles = await campaignRoles(viewer.userId, campaignId)
  const allowed = canWrite(
    viewer,
    { campaignId, ownerId: viewer.userId, visibility: "private" },
    () => roles.dm
  )

  if (!allowed) {
    return {
      ok: false,
      code: "forbidden",
      formError: "You cannot create entities in that scope.",
    }
  }

  const id = crypto.randomUUID()

  const { error } = await supabaseAdmin.rpc("write_entity", {
    p_model: type,
    p_id: id,
    p_payload: { ...data, owner_id: viewer.userId },
    p_actor: viewer.userId,
    p_base_updated_at: null,
  })

  if (error) return mapDbError(error)
  return { ok: true, id }
}

/**
 * Updates an entity. Authorizes the source scope, the destination scope when
 * the campaign changes, and the concurrency token, then writes atomically.
 */
export async function updateEntity(
  type: EntityType,
  id: string,
  payload: Record<string, unknown>,
  baseUpdatedAt: string | null,
  viewer: Viewer
): Promise<WriteResult> {
  if (!isEntityType(type)) {
    return { ok: false, code: "validation", formError: "Unknown entity type." }
  }

  const parsed = ENTITY_SCHEMAS[type].update.safeParse(payload)
  if (!parsed.success) return validationResult(parsed.error)

  const data = parsed.data as Record<string, unknown>

  const existing = await loadEntityScope(type, id)

  if (!existing) {
    return {
      ok: false,
      code: "not_found",
      formError: "That entity no longer exists.",
    }
  }

  const source = await campaignRoles(viewer.userId, existing.campaign_id)
  const canEditSource = canWrite(
    viewer,
    {
      campaignId: existing.campaign_id,
      ownerId: existing.owner_id,
      visibility: existing.visibility,
    },
    () => source.dm
  )

  if (!canEditSource) {
    return {
      ok: false,
      code: "forbidden",
      formError: "You cannot edit that entity.",
    }
  }

  if ("campaign_id" in data) {
    const destinationId = (data.campaign_id as string | null) ?? null
    const destination = await campaignRoles(viewer.userId, destinationId)
    const canEditDestination = canWrite(
      viewer,
      {
        campaignId: destinationId,
        ownerId: existing.owner_id,
        visibility: existing.visibility,
      },
      () => destination.dm
    )

    if (!canEditDestination) {
      return {
        ok: false,
        code: "forbidden",
        formError: "You cannot move the entity into that scope.",
      }
    }
  }

  const { error: writeError } = await supabaseAdmin.rpc("write_entity", {
    p_model: type,
    p_id: id,
    p_payload: data,
    p_actor: viewer.userId,
    p_base_updated_at: baseUpdatedAt,
  })

  if (writeError) return mapDbError(writeError)
  return { ok: true, id }
}

/**
 * Merges a partial `metadata` patch into an entity, key by key.
 *
 * Absent keys are untouched; a `null` value removes the key; keys already on
 * the row that the patch does not mention are preserved (#23).
 */
export async function updateEntityMetadata(
  type: EntityType,
  id: string,
  patch: Record<string, string | null>,
  viewer: Session
): Promise<void> {
  if (viewer.role !== "DM" && viewer.role !== "ADMIN") {
    throw new Error("Only a DM may edit entity metadata")
  }
  if (!isEntityType(type)) {
    throw new Error(`Unknown entity type: ${type}`)
  }

  const { data, error } = await supabaseAdmin
    .from(type)
    .select("metadata")
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error(`No ${type} row with id ${id}`)

  const current = (data.metadata ?? {}) as Record<string, unknown>
  const next: Record<string, unknown> = { ...current }

  for (const [key, value] of Object.entries(patch)) {
    if (value === null) delete next[key]
    else next[key] = value
  }

  const { error: updateError } = await supabaseAdmin
    .from(type)
    .update({ metadata: next })
    .eq("id", id)

  if (updateError) throw updateError
}

/**
 * Deletes an entity and everything that points at it: relations, appearances,
 * the specialized row, and the `entities` registry row. The cleanup runs in one
 * transaction inside `public.delete_entity(uuid)`.
 */
export async function deleteEntity(
  type: EntityType,
  id: string,
  viewer: Session
): Promise<void> {
  if (viewer.role !== "DM" && viewer.role !== "ADMIN") {
    throw new Error("Only a DM may delete an entity")
  }
  if (!isEntityType(type)) {
    throw new Error(`Unknown entity type: ${type}`)
  }

  const { error } = await supabaseAdmin.rpc("delete_entity", {
    p_entity_id: id,
  })

  if (error) throw error
}
