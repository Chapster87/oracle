"use client"

import React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"
import clsx from "clsx"

import s from "./style.module.css"

type CheckboxProps = {
  label?: string
  className?: string
} & React.ComponentProps<typeof CheckboxPrimitive.Root>

/** Radix Checkbox wrapper with an optional inline label. */
export default function Checkbox({
  label,
  className,
  id,
  ...props
}: CheckboxProps) {
  return (
    <div className={clsx(s.wrapper, className)}>
      <CheckboxPrimitive.Root id={id} className={s.root} {...props}>
        <CheckboxPrimitive.Indicator className={s.indicator}>
          <Check size={14} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label && (
        <label htmlFor={id} className={s.label}>
          {label}
        </label>
      )}
    </div>
  )
}
