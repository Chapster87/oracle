"use client"

import React, { useId, useMemo, useRef, useState } from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { Check, ChevronDown, Search } from "lucide-react"
import clsx from "clsx"

import Input from "@components/input"

import s from "./style.module.css"

export interface SelectOption {
  id: string
  label: string
}

export interface SearchSelectProps<T extends SelectOption> {
  /** The caller supplies the options; the control never queries anything. */
  options: T[]
  value: string | null
  onChange: (id: string | null) => void
  placeholder?: string
  /** Narrow the list. The control knows nothing about the option's domain. */
  filterOption?: (option: T) => boolean
  disabled?: boolean
  id?: string
  className?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean
}

interface Row {
  key: string
  label: string
  id: string | null
}

/**
 * Single-select, searchable listbox.
 *
 * Built on Radix Popover rather than Select because Select has no search. The
 * listbox is driven by the search input: arrows move the active row, Enter
 * commits it, and Escape closes the popover. Options are generic over
 * `{ id, label }`, so callers keep their own shape and narrow it with
 * `filterOption`.
 */
export default function SearchSelect<T extends SelectOption>({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  filterOption,
  disabled,
  id,
  className,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
}: SearchSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const selected = options.find((option) => option.id === value) ?? null

  const rows = useMemo<Row[]>(() => {
    const needle = query.trim().toLowerCase()

    const matches = options.filter((option) => {
      if (filterOption && !filterOption(option)) return false
      if (!needle) return true
      return option.label.toLowerCase().includes(needle)
    })

    const list: Row[] = matches.map((option) => ({
      key: option.id,
      label: option.label,
      id: option.id,
    }))

    if (value !== null) {
      list.push({ key: "__clear", label: "Clear selection", id: null })
    }

    return list
  }, [options, query, filterOption, value])

  const activeRow = rows[Math.min(activeIndex, Math.max(rows.length - 1, 0))]

  const reset = () => {
    setQuery("")
    setActiveIndex(0)
  }

  const commit = (nextId: string | null) => {
    onChange(nextId)
    setOpen(false)
    reset()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault()
        setActiveIndex((index) => Math.min(index + 1, rows.length - 1))
        break
      case "ArrowUp":
        event.preventDefault()
        setActiveIndex((index) => Math.max(index - 1, 0))
        break
      case "Home":
        event.preventDefault()
        setActiveIndex(0)
        break
      case "End":
        event.preventDefault()
        setActiveIndex(Math.max(rows.length - 1, 0))
        break
      case "Enter":
        event.preventDefault()
        if (activeRow) commit(activeRow.id)
        break
    }
  }

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          id={id}
          className={clsx(s.trigger, className)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          disabled={disabled}
        >
          <span className={clsx(s.value, !selected && s.placeholder)}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown size={16} className={s.icon} />
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className={s.content}
          sideOffset={4}
          align="start"
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            inputRef.current?.focus()
          }}
        >
          <div className={s.searchRow}>
            <Input
              ref={inputRef}
              icon={<Search size={16} />}
              placeholder="Search..."
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setActiveIndex(0)
              }}
              onKeyDown={handleKeyDown}
              role="combobox"
              aria-label="Search options"
              aria-expanded={open}
              aria-controls={listId}
              aria-activedescendant={
                activeRow ? `${listId}-${activeRow.key}` : undefined
              }
              aria-autocomplete="list"
              autoComplete="off"
            />
          </div>

          <ul id={listId} role="listbox" className={s.list}>
            {rows.length === 0 && <li className={s.empty}>No matches.</li>}

            {rows.map((row, index) => {
              const isActive = row === activeRow
              const isSelected = row.id !== null && row.id === value

              return (
                <li
                  key={row.key}
                  id={`${listId}-${row.key}`}
                  role="option"
                  aria-selected={isSelected}
                  className={clsx(
                    s.option,
                    isActive && s.active,
                    row.id === null && s.clear
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => commit(row.id)}
                >
                  <span>{row.label}</span>
                  {isSelected && <Check size={14} />}
                </li>
              )
            })}
          </ul>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
