"use client"

import React from "react"
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react"
import clsx from "clsx"

import Button from "@components/button"
import Input from "@components/input"

import s from "./style.module.css"

type RepeatableTextListProps = {
  value: string[]
  onChange: (value: string[]) => void
  addLabel?: string
  minRows?: number
  maxRows?: number
  id?: string
  disabled?: boolean
  className?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean
}

/**
 * Ordered list of single-line text rows. Rows can be added, removed, and
 * reordered; the emitted value preserves order. Compose with `Field` for a
 * label, help, and error text.
 */
export default function RepeatableTextList({
  value,
  onChange,
  addLabel = "Add row",
  minRows = 0,
  maxRows,
  id,
  disabled = false,
  className,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: RepeatableTextListProps) {
  const atMax = maxRows !== undefined && value.length >= maxRows
  const atMin = value.length <= minRows

  const update = (index: number, text: string) => {
    onChange(value.map((row, i) => (i === index ? text : row)))
  }

  const remove = (index: number) => {
    if (atMin) return
    onChange(value.filter((_, i) => i !== index))
  }

  const move = (index: number, offset: number) => {
    const target = index + offset
    if (target < 0 || target >= value.length) return

    const next = [...value]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  const add = () => {
    if (atMax) return
    onChange([...value, ""])
  }

  return (
    <div className={clsx(s.root, className)}>
      {value.map((row, index) => (
        <div key={index} className={s.row}>
          <Input
            id={index === 0 ? id : id ? `${id}-${index}` : undefined}
            className={s.rowInput}
            value={row}
            onChange={(event) => update(index, event.target.value)}
            aria-label={index === 0 ? undefined : `Row ${index + 1}`}
            aria-describedby={index === 0 ? ariaDescribedBy : undefined}
            aria-invalid={index === 0 ? ariaInvalid : undefined}
            disabled={disabled}
          />
          <div className={s.actions}>
            <Button
              unstyled
              className={s.iconButton}
              aria-label={`Move row ${index + 1} up`}
              onClick={() => move(index, -1)}
              disabled={disabled || index === 0}
            >
              <ArrowUp size={14} />
            </Button>
            <Button
              unstyled
              className={s.iconButton}
              aria-label={`Move row ${index + 1} down`}
              onClick={() => move(index, 1)}
              disabled={disabled || index === value.length - 1}
            >
              <ArrowDown size={14} />
            </Button>
            <Button
              unstyled
              className={s.iconButton}
              aria-label={`Remove row ${index + 1}`}
              onClick={() => remove(index)}
              disabled={disabled || atMin}
            >
              <X size={14} />
            </Button>
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        size="small"
        className={s.add}
        onClick={add}
        disabled={disabled || atMax}
      >
        <Plus size={14} />
        {addLabel}
      </Button>
    </div>
  )
}
