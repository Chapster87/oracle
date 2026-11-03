import type {
  Draft,
  DraftBatch,
  DraftKind,
  EntityType,
  SlotOp,
  WriteResult,
} from "@/types"
import { isEntityType } from "@/utils/entity"

import { proposeDraftSchema } from "@/schemas/draft"
import { ENTITY_SCHEMAS } from "@/schemas/registry"

import { createSupabaseServerClient } from "../auth"
import type { Viewer } from "../rbac"
import { canWriteEntity, canWriteScope } from "./entities"

interface DbError {
  code?: string
  message: string
}

function mapDbError(error: DbError): WriteResult {
  if (error.code === "PT409") {
    return {
      ok: false,
      code: "conflict",
      formError:
        "Someone else changed this draft or its entity. Reload and try again.",
    }
  }

  if (error.code === "PT422" || error.code === "23503") {
    return { ok: false, code: "dependency", formError: error.message }
  }

  if (error.code === "42501") {
    return { ok: false, code: "forbidden", formError: error.message }
  }

  if (error.code === "P0002") {
    return { ok: false, code: "not_found", formError: error.message }
  }

  if (error.code === "22023") {
    return { ok: false, code: "validation", formError: error.message }
  }

  throw error
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

export interface ProposeDraftInput {
  kind: DraftKind
  model: EntityType
  targetId?: string
  campaignId: string | null
  payload?: Record<string, unknown>
  slotOps?: SlotOp[]
  baseUpdatedAt?: string | null
  batchId: string
  lane?: string | null
  supersedes?: string | null
}

/** Creates a review batch for one proposal run. */
export async function createBatch(
  campaignId: string | null,
  viewer: Viewer,
  planId: string | null = null
): Promise<WriteResult> {
  if (!(await canWriteScope(campaignId, viewer))) {
    return {
      ok: false,
      code: "forbidden",
      formError: "You cannot create drafts in that scope.",
    }
  }

  const db = await createSupabaseServerClient()
  const id = crypto.randomUUID()

  const { error } = await db.from("draft_batches").insert({
    id,
    campaign_id: campaignId,
    created_by: viewer.userId,
    plan_id: planId,
  })

  if (error) return mapDbError(error)
  return { ok: true, id }
}

/**
 * Stages a proposed entity change.
 *
 * A re-propose of an untouched draft overwrites it in place; a re-propose of a
 * DM-edited draft forks a sibling linked by `supersedes_id` (#67).
 */
export async function proposeDraft(
  input: ProposeDraftInput,
  viewer: Viewer
): Promise<WriteResult> {
  const parsed = proposeDraftSchema.safeParse(input)
  if (!parsed.success) return validationResult(parsed.error)

  const data = parsed.data
  if (!isEntityType(data.model)) {
    return { ok: false, code: "validation", formError: "Unknown entity type." }
  }

  if (data.kind !== "delete") {
    const schema =
      data.kind === "create"
        ? ENTITY_SCHEMAS[data.model].create
        : ENTITY_SCHEMAS[data.model].update
    const payload = schema.safeParse(data.payload)
    if (!payload.success) return validationResult(payload.error)
  }

  if (!(await canWriteScope(data.campaignId, viewer))) {
    return {
      ok: false,
      code: "forbidden",
      formError: "You cannot propose drafts in that scope.",
    }
  }

  if (data.kind !== "create" && data.targetId) {
    if (!(await canWriteEntity(data.model, data.targetId, viewer))) {
      return {
        ok: false,
        code: "forbidden",
        formError: "You cannot propose changes to that entity.",
      }
    }
  }

  const db = await createSupabaseServerClient()

  if (data.supersedes) {
    const { data: original, error } = await db
      .from("drafts")
      .select("id, status, dm_edited_at")
      .eq("id", data.supersedes)
      .maybeSingle()

    if (error) throw error
    if (!original) {
      return {
        ok: false,
        code: "not_found",
        formError: "That draft no longer exists.",
      }
    }
    if (original.status !== "pending") {
      return {
        ok: false,
        code: "conflict",
        formError: "That draft has already been decided.",
      }
    }

    if (original.dm_edited_at === null) {
      const { error: updateError } = await db
        .from("drafts")
        .update({
          payload: data.payload,
          slot_ops: data.slotOps,
          base_updated_at: data.baseUpdatedAt ?? null,
        })
        .eq("id", data.supersedes)

      if (updateError) return mapDbError(updateError)
      return { ok: true, id: data.supersedes }
    }
  }

  const id = crypto.randomUUID()

  const { error } = await db.from("drafts").insert({
    id,
    kind: data.kind,
    model: data.model,
    target_id: data.targetId ?? crypto.randomUUID(),
    campaign_id: data.campaignId,
    payload: data.payload,
    slot_ops: data.slotOps,
    base_updated_at: data.baseUpdatedAt ?? null,
    batch_id: data.batchId,
    lane: data.lane ?? null,
    created_by: viewer.userId,
    supersedes_id: data.supersedes ?? null,
  })

  if (error) return mapDbError(error)
  return { ok: true, id }
}

/** Saves a DM edit to a pending draft and marks it as DM-edited. */
export async function updateDraftPayload(
  draftId: string,
  payload: Record<string, unknown>,
  slotOps: SlotOp[],
  viewer: Viewer
): Promise<WriteResult> {
  const db = await createSupabaseServerClient()

  const { data: draft, error } = await db
    .from("drafts")
    .select("id, status, campaign_id, model, kind")
    .eq("id", draftId)
    .maybeSingle()

  if (error) throw error
  if (!draft) {
    return {
      ok: false,
      code: "not_found",
      formError: "That draft no longer exists.",
    }
  }
  if (draft.status !== "pending") {
    return {
      ok: false,
      code: "conflict",
      formError: "That draft has already been decided.",
    }
  }
  if (!(await canWriteScope(draft.campaign_id, viewer))) {
    return {
      ok: false,
      code: "forbidden",
      formError: "You cannot edit that draft.",
    }
  }

  if (draft.kind !== "delete") {
    if (!isEntityType(draft.model)) {
      return { ok: false, code: "validation", formError: "Unknown entity type." }
    }

    const schema =
      draft.kind === "create"
        ? ENTITY_SCHEMAS[draft.model].create
        : ENTITY_SCHEMAS[draft.model].update
    const parsed = schema.safeParse(payload)
    if (!parsed.success) return validationResult(parsed.error)
  }

  const { error: updateError } = await db
    .from("drafts")
    .update({
      payload,
      slot_ops: slotOps,
      dm_edited_at: new Date().toISOString(),
    })
    .eq("id", draftId)

  if (updateError) return mapDbError(updateError)
  return { ok: true, id: draftId }
}

/** Discards a pending draft. */
export async function discardDraft(
  draftId: string,
  reason: string | null,
  viewer: Viewer
): Promise<WriteResult> {
  const db = await createSupabaseServerClient()

  const { data: draft, error } = await db
    .from("drafts")
    .select("id, status, campaign_id")
    .eq("id", draftId)
    .maybeSingle()

  if (error) throw error
  if (!draft) {
    return {
      ok: false,
      code: "not_found",
      formError: "That draft no longer exists.",
    }
  }
  if (draft.status !== "pending") {
    return {
      ok: false,
      code: "conflict",
      formError: "That draft has already been decided.",
    }
  }
  if (!(await canWriteScope(draft.campaign_id, viewer))) {
    return {
      ok: false,
      code: "forbidden",
      formError: "You cannot discard that draft.",
    }
  }

  const { error: updateError } = await db
    .from("drafts")
    .update({
      status: "discarded",
      reason,
      decided_by: viewer.userId,
      decided_at: new Date().toISOString(),
    })
    .eq("id", draftId)

  if (updateError) return mapDbError(updateError)
  return { ok: true, id: draftId }
}

/** Promotes one draft into the entity tables, atomically. */
export async function promoteDraft(draftId: string): Promise<WriteResult> {
  const db = await createSupabaseServerClient()

  const { data, error } = await db.rpc("promote_draft", {
    p_draft_id: draftId,
  })

  if (error) return mapDbError(error)
  return { ok: true, id: data as string }
}

/** Loads one batch, or null when it is missing or not visible. */
export async function getBatch(batchId: string): Promise<DraftBatch | null> {
  const db = await createSupabaseServerClient()

  const { data, error } = await db
    .from("draft_batches")
    .select("*")
    .eq("id", batchId)
    .maybeSingle()

  if (error) throw error
  return (data as DraftBatch | null) ?? null
}

/** Lists a batch's drafts in proposal order. */
export async function listDrafts(batchId: string): Promise<Draft[]> {
  const db = await createSupabaseServerClient()

  const { data, error } = await db
    .from("drafts")
    .select("*")
    .eq("batch_id", batchId)
    .order("created_at", { ascending: true })

  if (error) throw error
  return (data ?? []) as Draft[]
}

/** Closes a batch once every draft is decided. */
export async function closeBatch(
  batchId: string,
  viewer: Viewer
): Promise<WriteResult> {
  const db = await createSupabaseServerClient()

  const { data: batch, error } = await db
    .from("draft_batches")
    .select("id, campaign_id")
    .eq("id", batchId)
    .maybeSingle()

  if (error) throw error
  if (!batch) {
    return {
      ok: false,
      code: "not_found",
      formError: "That batch no longer exists.",
    }
  }
  if (!(await canWriteScope(batch.campaign_id, viewer))) {
    return {
      ok: false,
      code: "forbidden",
      formError: "You cannot close that batch.",
    }
  }

  const { error: updateError } = await db
    .from("draft_batches")
    .update({ status: "closed", decided_at: new Date().toISOString() })
    .eq("id", batchId)

  if (updateError) return mapDbError(updateError)
  return { ok: true, id: batchId }
}
