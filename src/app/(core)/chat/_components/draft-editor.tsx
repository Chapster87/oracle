"use client"

import { useState, useTransition } from "react"

import Button from "@components/button"
import Field from "@components/field"
import Input from "@components/input"
import Text from "@components/text"
import Textarea from "@components/textarea"

import { fieldSpecsFor } from "@/forms/registry"
import { updateDraftAction } from "@/server/actions/drafts"
import type { Draft, EntityType } from "@/types"

import s from "../style.module.css"

/** A compact inline editor over the draft's payload. */
export default function DraftEditor({
  draft,
  onSaved,
}: {
  draft: Draft
  onSaved: () => void
}) {
  const specs = fieldSpecsFor(draft.model as EntityType).filter(
    (spec) => spec.widget === "text" || spec.widget === "textarea"
  )

  const [values, setValues] = useState<Record<string, unknown>>(draft.payload)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const setValue = (name: string, value: string) =>
    setValues((current) => ({ ...current, [name]: value }))

  const save = () => {
    startTransition(async () => {
      const result = await updateDraftAction(draft.id, values, draft.slot_ops)
      if (!result.ok) {
        setError(result.formError ?? "Could not save the draft.")
        return
      }
      setError(null)
      onSaved()
    })
  }

  return (
    <div className={s.editor}>
      {specs.map((spec) => (
        <Field key={spec.name} label={spec.label} help={spec.help}>
          {spec.widget === "textarea" ? (
            <Textarea
              rows={spec.rows ?? 3}
              value={String(values[spec.name] ?? "")}
              onChange={(event) => setValue(spec.name, event.target.value)}
            />
          ) : (
            <Input
              value={String(values[spec.name] ?? "")}
              onChange={(event) => setValue(spec.name, event.target.value)}
            />
          )}
        </Field>
      ))}

      {error && (
        <Text size="sm" className={s.error}>
          {error}
        </Text>
      )}

      <Button size="small" onClick={save} disabled={pending}>
        Save draft
      </Button>
    </div>
  )
}
