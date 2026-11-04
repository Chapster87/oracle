"use server"

import type { Draft, DraftBatch, SlotOp, WriteResult } from "@/types"

import { requireDmViewer } from "@/server/auth"
import {
  discardDraft,
  getBatch,
  listDrafts,
  promoteDraft,
  updateDraftPayload,
} from "@/server/cms/drafts"

/** Loads one batch and its drafts for the review tray. */
export async function loadBatchAction(
  batchId: string
): Promise<{ batch: DraftBatch; drafts: Draft[] } | null> {
  await requireDmViewer()

  const batch = await getBatch(batchId)
  if (!batch) return null

  return { batch, drafts: await listDrafts(batchId) }
}

/** Saves a DM edit to a pending draft. */
export async function updateDraftAction(
  draftId: string,
  payload: Record<string, unknown>,
  slotOps: SlotOp[]
): Promise<WriteResult> {
  const viewer = await requireDmViewer()
  return updateDraftPayload(draftId, payload, slotOps, viewer)
}

/** Promotes one draft into the live entity tables. */
export async function promoteDraftAction(draftId: string): Promise<WriteResult> {
  await requireDmViewer()
  return promoteDraft(draftId)
}

/** Discards a pending draft. */
export async function discardDraftAction(draftId: string): Promise<WriteResult> {
  const viewer = await requireDmViewer()
  return discardDraft(draftId, "discarded from the review tray", viewer)
}
