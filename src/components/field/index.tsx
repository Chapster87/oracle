"use client"

import React from "react"
import clsx from "clsx"

import s from "./style.module.css"

type FieldProps = {
  label: string
  help?: string
  error?: string
  id?: string
  children: React.ReactElement<any>
  className?: string
}

/**
 * Wraps a single form control with a label, optional help text, and an error
 * message. The control receives the generated id and the aria wiring.
 */
export default function Field({
  label,
  help,
  error,
  id,
  children,
  className,
}: FieldProps) {
  const generatedId = React.useId()
  const fieldId = id ?? generatedId
  const helpId = `${fieldId}-help`
  const errorId = `${fieldId}-error`

  const describedBy =
    [help ? helpId : null, error ? errorId : null].filter(Boolean).join(" ") ||
    undefined

  const control = React.cloneElement(children, {
    id: fieldId,
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : undefined,
  })

  return (
    <div className={clsx(s.field, className)}>
      <label className={s.label} htmlFor={fieldId}>
        {label}
      </label>
      <div className={s.control}>{control}</div>
      {help && (
        <span id={helpId} className={s.help}>
          {help}
        </span>
      )}
      {error && (
        <span id={errorId} className={s.error}>
          {error}
        </span>
      )}
    </div>
  )
}
