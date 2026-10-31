"use client"

import React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown } from "lucide-react"
import clsx from "clsx"

import s from "./style.module.css"

type SelectProps = React.ComponentProps<typeof SelectPrimitive.Root> & {
  id?: string
  placeholder?: string
  className?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean
}

/**
 * Radix Select wrapper. The trigger carries the id and aria wiring so it can
 * be composed inside `Field`.
 */
export function Select({
  id,
  placeholder,
  className,
  children,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...rootProps
}: SelectProps) {
  return (
    <SelectPrimitive.Root {...rootProps}>
      <SelectPrimitive.Trigger
        id={id}
        className={clsx(s.trigger, className)}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon className={s.icon}>
          <ChevronDown size={16} />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={s.content}
          position="popper"
          sideOffset={4}
        >
          <SelectPrimitive.Viewport className={s.viewport}>
            {children}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

type SelectItemProps = React.ComponentProps<typeof SelectPrimitive.Item>

export function SelectItem({ className, children, ...props }: SelectItemProps) {
  return (
    <SelectPrimitive.Item className={clsx(s.item, className)} {...props}>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className={s.indicator}>
        <Check size={14} />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}
