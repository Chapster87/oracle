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
  connectDndBeyondAction,
  type ActionResult,
} from "@/server/actions/entities"

import s from "./connect-dialog.module.css"

interface ConnectDialogProps {
  type: EntityType
  id: string
  name: string
  label: string
  /** Existing URL, when editing rather than connecting for the first time. */
  initialUrl?: string
  children: React.ReactNode
}

/**
 * The write half of the D&D Beyond integration (#26): a URL field that merges
 * `metadata.ddb_url` into the entity and revalidates the detail route. When a
 * URL already exists it also offers removal.
 */
export default function ConnectDialog({
  type,
  id,
  name,
  label,
  initialUrl,
  children,
}: ConnectDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(connectDndBeyondAction, null)

  useEffect(() => {
    if (state?.ok) setOpen(false)
  }, [state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent>
          <DialogTitle>
            {initialUrl ? "Edit D&D Beyond link" : "Connect D&D Beyond"}
          </DialogTitle>
          <DialogDescription>
            {initialUrl
              ? `Update or remove the D&D Beyond URL for ${name}'s ${label.toLowerCase()}.`
              : `Paste the D&D Beyond URL for ${name}'s ${label.toLowerCase()}.`}
          </DialogDescription>

          <form action={formAction} className={s.form}>
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="id" value={id} />

            <label className={s.field}>
              <span className={s.label}>D&amp;D Beyond URL</span>
              <input
                className={s.input}
                name="ddb_url"
                type="url"
                required
                defaultValue={initialUrl ?? ""}
                placeholder="https://www.dndbeyond.com/characters/12345678"
                aria-invalid={state?.fieldErrors?.ddb_url ? true : undefined}
              />
              {state?.fieldErrors?.ddb_url && (
                <span className={s.error}>{state.fieldErrors.ddb_url}</span>
              )}
            </label>

            {state?.formError && (
              <span className={s.error}>{state.formError}</span>
            )}

            <div className={s.actions}>
              <div>
                {initialUrl && (
                  <Button
                    type="submit"
                    name="intent"
                    value="remove"
                    variant="link"
                    formNoValidate
                  >
                    Remove link
                  </Button>
                )}
              </div>
              <div className={s.actionsRight}>
                <DialogClose asChild>
                  <Button variant="link" type="button">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" isLoading={pending}>
                  Save
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
