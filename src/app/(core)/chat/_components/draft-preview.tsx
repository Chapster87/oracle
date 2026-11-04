"use client"

import { useMemo, useState } from "react"

import Button from "@components/button"
import EntityDetail from "@/components/entity-detail"
import Text from "@components/text"

import type { Draft, EntityDetailData, SecretSlot } from "@/types"
import { filterSlots } from "@/utils/secrets"

import s from "../style.module.css"

function buildPreview(draft: Draft, isDM: boolean): EntityDetailData {
  const payload = draft.payload as Record<string, unknown>
  const entity = {
    id: draft.target_id,
    name: String(payload.name ?? "Untitled"),
    ...payload,
    owner_id: draft.created_by,
    visibility: "private",
    created_at: draft.created_at,
    updated_at: draft.updated_at,
  }

  const allSlots: SecretSlot[] = draft.slot_ops
    .filter((op) => op.op === "upsert")
    .map((op, index) => ({
      id: `${draft.id}-${index}`,
      entity_id: draft.target_id,
      slot: op.slot,
      source_column: op.source_column ?? null,
      value: op.value,
      audience: op.audience ?? "dm",
      revealed_at: op.revealed_at ?? null,
      position: op.position ?? index,
    }))

  const slots = isDM
    ? allSlots
    : filterSlots(allSlots, {
        isDM: false,
        userId: "preview-player",
        ownerId: draft.created_by,
      })

  return {
    type: draft.model,
    entity: entity as EntityDetailData["entity"],
    related: [],
    region: null,
    slots,
  }
}

/** Renders a draft through the same detail view as the live read path. */
export default function DraftPreview({ draft }: { draft: Draft }) {
  const [isDM, setIsDM] = useState(false)
  const data = useMemo(() => buildPreview(draft, isDM), [draft, isDM])

  return (
    <div className={s.preview}>
      <div className={s.previewHeader}>
        <Text size="sm" className={s.eyebrow}>
          {isDM ? "DM view" : "Player view"}
        </Text>
        <Button
          size="small"
          variant="outline"
          onClick={() => setIsDM((value) => !value)}
        >
          {isDM ? "Show player view" : "Show DM view"}
        </Button>
      </div>
      <EntityDetail data={data} isDM={isDM} />
    </div>
  )
}
