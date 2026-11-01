"use client"

import React, { useEffect, useState } from "react"
import { useFormStatus } from "react-dom"

import Button from "@components/button"
import Field from "@components/field"
import Heading from "@components/heading"
import { Select, SelectItem } from "@components/select"
import Text from "@components/text"
import Textarea from "@components/textarea"

import type { EntityType, SecretAudience, SecretSlot } from "@/types"
import { nextSecretSlotName } from "@/utils/secrets"

import s from "./style.module.css"

export interface SecretFieldRow {
  name: string
  label: string
  value: string | null
  slotted: boolean
}

export interface SecretSlotsProps {
  type: EntityType
  entityId: string
  fields: SecretFieldRow[]
  slots: SecretSlot[]
  actions: {
    mark: (formData: FormData) => Promise<void>
    unmark: (formData: FormData) => Promise<void>
    add: (formData: FormData) => Promise<void>
    save: (formData: FormData) => Promise<void>
    remove: (formData: FormData) => Promise<void>
    setAudience: (formData: FormData) => Promise<void>
  }
}

function slotText(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value
  return JSON.stringify(value)
}

/** A submit button that reports its own form's pending state. */
function PanelButton({
  label,
  ariaLabel,
  pendingLabel = "Saving…",
  variant = "outline",
}: {
  label: string
  ariaLabel?: string
  pendingLabel?: string
  variant?: "outline" | "ghost"
}) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      variant={variant}
      size="small"
      disabled={pending}
      aria-label={ariaLabel}
    >
      {pending ? pendingLabel : label}
    </Button>
  )
}

/** The next free `secret_N` name, so a removed slot's name is not reused. */
function secretLabel(slot: SecretSlot): string {
  const number = slot.slot.replace(/^secret_/, "")

  return slot.source_column
    ? `Secret ${number} — from ${slot.source_column}`
    : `Secret ${number}`
}

/**
 * DM-only controls for the secret-slot model (#62). Each control is its own
 * form, so marking, revealing, and editing act immediately rather than on the
 * main form's submit.
 */
export default function SecretSlots({
  type,
  entityId,
  fields,
  slots,
  actions,
}: SecretSlotsProps) {
  // The audience is mirrored into a hidden input rather than relying on Radix's
  // own hidden select, whose value updates in an effect and can lag a fast
  // submit.
  const [audiences, setAudiences] = useState<Record<string, SecretAudience>>(
    () => Object.fromEntries(slots.map((slot) => [slot.slot, slot.audience]))
  )

  // Re-sync when the server sends new slot data after a save, so the dropdown
  // shows the value that was actually persisted.
  useEffect(() => {
    setAudiences(
      Object.fromEntries(slots.map((slot) => [slot.slot, slot.audience]))
    )
  }, [slots])

  const audienceFor = (slot: SecretSlot) =>
    audiences[slot.slot] ?? slot.audience

  const hidden = (
    <>
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="id" value={entityId} />
    </>
  )

  return (
    <section className={s.panel}>
      <Heading level="h2" display="h5">
        Secrets
      </Heading>
      <Text size="sm" className={s.intro}>
        Marked fields are withheld from players until revealed. A player never
        receives a DM-only slot, or an owner slot for an entity they do not own.
      </Text>

      <div className={s.group}>
        <Heading level="h3" display="h6">
          Markable fields
        </Heading>

        {fields.map((field) => (
          <div key={field.name} className={s.row}>
            <div className={s.rowMain}>
              <span className={s.rowLabel}>{field.label}</span>
              <Text size="sm" className={s.rowValue}>
                {field.slotted
                  ? "Hidden in a secret slot"
                  : field.value || "Empty"}
              </Text>
            </div>

            <form action={field.slotted ? actions.unmark : actions.mark}>
              {hidden}
              <input type="hidden" name="column" value={field.name} />
              <PanelButton
                label={field.slotted ? "Unmark" : "Mark secret"}
                ariaLabel={`${field.slotted ? "Unmark" : "Mark"} ${field.label} secret`}
              />
            </form>
          </div>
        ))}
      </div>

      <div className={s.group}>
        <Heading level="h3" display="h6">
          Secret slots
        </Heading>

        {slots.length === 0 && (
          <Text size="sm" className={s.rowValue}>
            No secret slots yet.
          </Text>
        )}

        {slots.map((slot) => (
          <div key={slot.id} className={s.slot}>
            <div className={s.slotHeader}>
              <span className={s.rowLabel}>{secretLabel(slot)}</span>
              <span className={s.audience}>{slot.audience}</span>
            </div>

            <form action={actions.save} className={s.slotForm}>
              {hidden}
              <input type="hidden" name="slot" value={slot.slot} />
              <Textarea
                name="value"
                rows={3}
                defaultValue={slotText(slot.value)}
                aria-label={`Content of ${slot.slot}`}
              />
              <PanelButton label="Save content" />
            </form>

            <div className={s.slotActions}>
              <form action={actions.setAudience} className={s.audienceForm}>
                {hidden}
                <input type="hidden" name="slot" value={slot.slot} />
                <Select
                  value={audienceFor(slot)}
                  onValueChange={(value) =>
                    setAudiences((current) => ({
                      ...current,
                      [slot.slot]: value as SecretAudience,
                    }))
                  }
                  aria-label={`Audience of ${slot.slot}`}
                >
                  <SelectItem value="dm">DM only</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </Select>
                <input
                  type="hidden"
                  name="audience"
                  value={audienceFor(slot)}
                />
                <PanelButton label="Set audience" />
              </form>

              {!slot.source_column && (
                <form action={actions.remove}>
                  {hidden}
                  <input type="hidden" name="slot" value={slot.slot} />
                  <PanelButton label="Remove" variant="ghost" />
                </form>
              )}
            </div>
          </div>
        ))}

        <form action={actions.add} className={s.addForm}>
          {hidden}
          <input type="hidden" name="slot" value={nextSecretSlotName(slots)} />
          <Field
            label="New secret"
            help="Stored as a free-standing slot, DM-only until revealed."
          >
            <Textarea name="value" rows={2} />
          </Field>
          <PanelButton label="Add secret" />
        </form>
      </div>
    </section>
  )
}
