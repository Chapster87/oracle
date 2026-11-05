"use client"

import { useMemo, useState } from "react"

import Button from "@components/button"
import EntityDetail from "@/components/entity-detail"
import Text from "@components/text"

import type { Draft } from "@/types"
import { projectDraft } from "@/utils/entity-view"

import s from "../style.module.css"

/** Renders a draft through the same detail view as the live read path. */
export default function DraftPreview({ draft }: { draft: Draft }) {
  const [isDM, setIsDM] = useState(false)

  const data = useMemo(
    () =>
      projectDraft(draft, {
        isDM,
        userId: isDM ? draft.created_by : "preview-player",
        ownerId: draft.created_by,
      }),
    [draft, isDM]
  )

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
