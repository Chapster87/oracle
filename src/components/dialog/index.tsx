"use client"

import React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import s from "./styles.module.css"

type DialogProps = React.ComponentProps<typeof DialogPrimitive.Root>

export function Dialog(props: DialogProps) {
  return <DialogPrimitive.Root {...props} />
}

type DialogTriggerProps = React.ComponentProps<typeof DialogPrimitive.Trigger>

export function DialogTrigger(props: DialogTriggerProps) {
  return <DialogPrimitive.Trigger {...props} />
}

type DialogPortalProps = React.ComponentProps<typeof DialogPrimitive.Portal>

export function DialogPortal(props: DialogPortalProps) {
  return <DialogPrimitive.Portal {...props} />
}

type DialogOverlayProps = React.ComponentProps<typeof DialogPrimitive.Overlay>

export function DialogOverlay({ className, ...props }: DialogOverlayProps) {
  return (
    <DialogPrimitive.Overlay
      className={`${s.overlay} ${className || ""}`}
      {...props}
    />
  )
}

type DialogContentProps = React.ComponentProps<typeof DialogPrimitive.Content>

export function DialogContent({ className, ...props }: DialogContentProps) {
  return (
    <DialogPrimitive.Content
      className={`${s.content} ${className || ""}`}
      {...props}
    />
  )
}

type DialogTitleProps = React.ComponentProps<typeof DialogPrimitive.Title>

export function DialogTitle({ className, ...props }: DialogTitleProps) {
  return (
    <DialogPrimitive.Title className={`${s.title} ${className || ""}`} {...props} />
  )
}

type DialogDescriptionProps = React.ComponentProps<
  typeof DialogPrimitive.Description
>

export function DialogDescription({
  className,
  ...props
}: DialogDescriptionProps) {
  return (
    <DialogPrimitive.Description
      className={`${s.description} ${className || ""}`}
      {...props}
    />
  )
}

type DialogCloseProps = React.ComponentProps<typeof DialogPrimitive.Close>

export function DialogClose({ className, ...props }: DialogCloseProps) {
  return (
    <DialogPrimitive.Close className={`${s.close} ${className || ""}`} {...props} />
  )
}
