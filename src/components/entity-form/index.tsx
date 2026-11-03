"use client"

import React, { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"

import Button from "@components/button"
import Checkbox from "@components/checkbox"
import Field from "@components/field"
import Input from "@components/input"
import Link from "@components/link"
import RepeatableTextList from "@components/repeatable-text-list"
import SearchSelect, { type SelectOption } from "@components/search-select"
import { Select, SelectItem } from "@components/select"
import TagInput from "@components/tag-input"
import Text from "@components/text"
import Textarea from "@components/textarea"

import type { FieldSpec } from "@/forms/registry"
import type { EntityType, WriteResult } from "@/types"

import s from "./style.module.css"

export interface EntityFormProps {
  type: EntityType
  mode: "create" | "edit"
  specs: FieldSpec[]
  /** Values keyed by spec name, e.g. `metadata.ddb_url`. */
  initial?: Record<string, unknown>
  entityId?: string
  baseUpdatedAt?: string | null
  options: Record<"locations" | "campaigns", SelectOption[]>
  action: (prev: WriteResult | null, formData: FormData) => Promise<WriteResult>
}

function asString(value: unknown): string {
  if (value === null || value === undefined) return ""
  return String(value)
}

function asArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : []
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : label}
    </Button>
  )
}

/**
 * The shared create/edit form (#21). One component, driven by the per-type
 * `FieldSpec[]` registry, with `mode` deciding the submit label and whether the
 * concurrency token is submitted.
 *
 * Controlled widgets (tags, ordered lists, entity pickers) carry their value in
 * a hidden input so the action sees flat `FormData`.
 */
export default function EntityForm({
  type,
  mode,
  specs,
  initial = {},
  entityId,
  baseUpdatedAt,
  options,
  action,
}: EntityFormProps) {
  const [state, formAction] = useActionState(action, null)
  const [values, setValues] = useState<Record<string, unknown>>(initial)

  const setValue = (name: string, value: unknown) =>
    setValues((current) => ({ ...current, [name]: value }))

  const errorFor = (name: string) =>
    state && !state.ok ? state.fieldErrors?.[name]?.[0] : undefined

  const renderControl = (spec: FieldSpec) => {
    const error = errorFor(spec.name)
    const value = values[spec.name]

    switch (spec.widget) {
      case "textarea":
        return (
          <Field
            key={spec.name}
            label={spec.label}
            help={spec.help}
            error={error}
          >
            <Textarea
              name={spec.name}
              rows={spec.rows ?? 4}
              defaultValue={asString(value)}
            />
          </Field>
        )

      case "number":
        return (
          <Field
            key={spec.name}
            label={spec.label}
            help={spec.help}
            error={error}
          >
            <Input
              type="number"
              name={spec.name}
              defaultValue={asString(value)}
            />
          </Field>
        )

      case "checkbox":
        return (
          <Field
            key={spec.name}
            label={spec.label}
            help={spec.help}
            error={error}
          >
            <Checkbox name={spec.name} defaultChecked={Boolean(value)} />
          </Field>
        )

      case "select":
        return (
          <Field
            key={spec.name}
            label={spec.label}
            help={spec.help}
            error={error}
          >
            <Select
              name={spec.name}
              defaultValue={asString(value) || spec.options?.[0]?.value}
            >
              {spec.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
          </Field>
        )

      case "tags":
        return (
          <React.Fragment key={spec.name}>
            <Field label={spec.label} help={spec.help} error={error}>
              <TagInput
                value={asArray(value)}
                onChange={(next) => setValue(spec.name, next)}
              />
            </Field>
            <input
              type="hidden"
              name={spec.name}
              value={JSON.stringify(asArray(value))}
            />
          </React.Fragment>
        )

      case "list":
        return (
          <React.Fragment key={spec.name}>
            <Field label={spec.label} help={spec.help} error={error}>
              <RepeatableTextList
                value={asArray(value)}
                onChange={(next) => setValue(spec.name, next)}
                addLabel={`Add ${spec.label.toLowerCase()}`}
              />
            </Field>
            <input
              type="hidden"
              name={spec.name}
              value={JSON.stringify(asArray(value))}
            />
          </React.Fragment>
        )

      case "entity":
        return (
          <React.Fragment key={spec.name}>
            <Field label={spec.label} help={spec.help} error={error}>
              <SearchSelect
                options={options[spec.optionSource ?? "campaigns"]}
                value={asString(value) || null}
                onChange={(next) => setValue(spec.name, next)}
                placeholder={`Select ${spec.label.toLowerCase()}`}
              />
            </Field>
            <input type="hidden" name={spec.name} value={asString(value)} />
          </React.Fragment>
        )

      case "json":
        return (
          <Field
            key={spec.name}
            label={spec.label}
            help={spec.help}
            error={error}
          >
            <Textarea
              name={spec.name}
              rows={spec.rows ?? 6}
              defaultValue={asString(value)}
            />
          </Field>
        )

      default:
        return (
          <Field
            key={spec.name}
            label={spec.label}
            help={spec.help}
            error={error}
          >
            <Input name={spec.name} defaultValue={asString(value)} />
          </Field>
        )
    }
  }

  return (
    <form action={formAction} className={s.form}>
      <input type="hidden" name="type" value={type} />
      {mode === "edit" && entityId && (
        <input type="hidden" name="id" value={entityId} />
      )}
      {mode === "edit" && (
        <input
          type="hidden"
          name="base_updated_at"
          value={baseUpdatedAt ?? ""}
        />
      )}

      {state && !state.ok && state.formError && (
        <Text className={s.formError}>{state.formError}</Text>
      )}

      {specs.map(renderControl)}

      <div className={s.actions}>
        <Link
          href={
            mode === "edit" && entityId ? `/${type}/${entityId}` : `/${type}`
          }
          buttonStyle
          variant="outline"
        >
          Cancel
        </Link>
        <SubmitButton label={mode === "edit" ? "Save changes" : "Create"} />
      </div>
    </form>
  )
}
