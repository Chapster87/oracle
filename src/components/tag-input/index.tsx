"use client"

import React from "react"
import { X } from "lucide-react"
import clsx from "clsx"

import Button from "@components/button"
import Input from "@components/input"

import s from "./style.module.css"

type TagInputProps = {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  /** When supplied, additions beyond this many tags are blocked. */
  max?: number
  id?: string
  disabled?: boolean
  className?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean
}

/**
 * Unordered set of short strings. Enter adds a chip, Backspace on an empty
 * field removes the last one. Duplicates are rejected case-insensitively.
 * Compose with `Field` for a label, help, and error text.
 */
export default function TagInput({
  value,
  onChange,
  placeholder = "Add a tag...",
  max,
  id,
  disabled = false,
  className,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: TagInputProps) {
  const [draft, setDraft] = React.useState("")
  const atMax = max !== undefined && value.length >= max

  const commit = () => {
    const trimmed = draft.trim()
    if (!trimmed || atMax) return

    const isDuplicate = value.some(
      (tag) => tag.toLowerCase() === trimmed.toLowerCase()
    )
    if (isDuplicate) {
      setDraft("")
      return
    }

    onChange([...value, trimmed])
    setDraft("")
  }

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()
      commit()
      return
    }

    if (event.key === "Backspace" && draft === "" && value.length > 0) {
      event.preventDefault()
      remove(value.length - 1)
    }
  }

  return (
    <div className={clsx(s.root, className)}>
      {value.length > 0 && (
        <ul className={s.chips}>
          {value.map((tag, index) => (
            <li key={tag} className={s.chip}>
              <span className={s.chipLabel}>{tag}</span>
              <Button
                unstyled
                className={s.remove}
                aria-label={`Remove ${tag}`}
                onClick={() => remove(index)}
                disabled={disabled}
              >
                <X size={12} />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Input
        id={id}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={atMax ? "Maximum number of tags reached" : placeholder}
        disabled={disabled}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
      />
    </div>
  )
}
