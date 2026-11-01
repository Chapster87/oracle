"use server"

import { revalidatePath } from "next/cache"

import {
  createSlot,
  deleteSlot,
  markField,
  setAudience,
  unmarkField,
  updateSlotValue,
} from "@/server/cms/secrets"
import { requireDmSession } from "@/server/session"
import type { SecretAudience, WriteResult } from "@/types"
import { isEntityType } from "@/utils/entity"

function readTarget(formData: FormData) {
  const type = String(formData.get("type") ?? "")
  const id = String(formData.get("id") ?? "")

  if (!isEntityType(type)) throw new Error("Unknown entity type")
  return { type, id }
}

function assertOk(result: WriteResult) {
  if (!result.ok) {
    throw new Error(result.formError ?? "The change was rejected.")
  }
}

function revalidate(type: string, id: string) {
  revalidatePath(`/${type}/${id}/edit`)
  revalidatePath(`/${type}/${id}`)
}

/** Moves a field's value into a slot named after it. */
export async function markSecretFieldAction(formData: FormData): Promise<void> {
  const viewer = requireDmSession()
  const { type, id } = readTarget(formData)
  const column = String(formData.get("column") ?? "")

  assertOk(await markField(type, id, column, viewer))
  revalidate(type, id)
}

/** Copies a slot's value back onto its column and removes the slot. */
export async function unmarkSecretFieldAction(formData: FormData): Promise<void> {
  const viewer = requireDmSession()
  const { type, id } = readTarget(formData)
  const column = String(formData.get("column") ?? "")

  assertOk(await unmarkField(type, id, column, viewer))
  revalidate(type, id)
}

/** Adds a free-standing `secret_N` slot. */
export async function addSecretSlotAction(formData: FormData): Promise<void> {
  const viewer = requireDmSession()
  const { type, id } = readTarget(formData)
  const slot = String(formData.get("slot") ?? "")
  const value = String(formData.get("value") ?? "")

  assertOk(await createSlot(type, id, slot, value, viewer))
  revalidate(type, id)
}

/** Replaces a slot's content without touching its audience. */
export async function saveSecretSlotAction(formData: FormData): Promise<void> {
  const viewer = requireDmSession()
  const { type, id } = readTarget(formData)
  const slot = String(formData.get("slot") ?? "")
  const value = String(formData.get("value") ?? "")

  assertOk(await updateSlotValue(type, id, slot, value, viewer))
  revalidate(type, id)
}

/** Raises or lowers a slot's audience. */
export async function setSecretAudienceAction(formData: FormData): Promise<void> {
  const viewer = requireDmSession()
  const { type, id } = readTarget(formData)
  const slot = String(formData.get("slot") ?? "")
  const audience = String(formData.get("audience") ?? "dm") as SecretAudience

  assertOk(await setAudience(type, id, slot, audience, viewer))
  revalidate(type, id)
}

/** Removes a free-standing `secret_N` slot. */
export async function deleteSecretSlotAction(formData: FormData): Promise<void> {
  const viewer = requireDmSession()
  const { type, id } = readTarget(formData)
  const slot = String(formData.get("slot") ?? "")

  assertOk(await deleteSlot(type, id, slot, viewer))
  revalidate(type, id)
}
