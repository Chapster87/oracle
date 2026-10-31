"use client"

import React, { useEffect, useState } from "react"
import { useActionState } from "react"

import Button from "@components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@components/dialog"

import type { EntityType } from "@/types"
import {
  deleteEntityAction,
  type ActionResult,
} from "@/server/actions/entities"

import s from "./delete-dialog.module.css"

interface DeleteDialogProps {
  type: EntityType
  id: string
  name: string
  children: React.ReactNode
}

/**
 * Confirmation for deleting an entity. The action removes the entity, its
 * relations, and its appearances, then returns to the directory.
 */
export default function DeleteDialog({
  type,
  id,
  name,
  children,
}: DeleteDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(deleteEntityAction, null)

  useEffect(() => {
    if (state?.ok) setOpen(false)
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent>
          <DialogTitle>Delete {name}?</DialogTitle>
          <DialogDescription>
            This removes the entity and every relation that points at it. It
            cannot be undone.
          </DialogDescription>

          <form action={formAction} className={s.form}>
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="id" value={id} />

            {state?.formError && (
              <span className={s.error}>{state.formError}</span>
            )}

            <div className={s.actions}>
              <DialogClose asChild>
                <Button variant="ghost" type="button">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" variant="destructive" isLoading={pending}>
                Delete
              </Button>
            </div>
          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
