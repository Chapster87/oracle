"use client"

import { useCallback, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import Button from "@components/button"
import Text from "@components/text"

import s from "../style.module.css"

const LABELS: Record<string, string> = {
  C: "Tabbed right panel",
  C1: "Right flyout review",
  C2: "Bottom tray review",
}

export default function Switcher({
  variants,
  current,
  onChange,
}: {
  variants: readonly string[]
  current: string
  onChange: (next: string) => void
}) {
  const index = Math.max(0, variants.indexOf(current))

  const cycle = useCallback(
    (delta: number) => {
      const next = variants[(index + delta + variants.length) % variants.length]
      onChange(next)
    },
    [index, variants, onChange]
  )

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return
      }
      if (event.key === "ArrowLeft") cycle(-1)
      if (event.key === "ArrowRight") cycle(1)
    }

    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [cycle])

  if (process.env.NODE_ENV === "production") return null

  return (
    <div className={s.switcher}>
      <Button
        unstyled
        className={s.switcherButton}
        onClick={() => cycle(-1)}
        aria-label="Previous variant"
      >
        <ChevronLeft size={16} />
      </Button>
      <Text size="sm" className={s.switcherLabel}>
        {current} — {LABELS[current] ?? "Variant"}
      </Text>
      <Button
        unstyled
        className={s.switcherButton}
        onClick={() => cycle(1)}
        aria-label="Next variant"
      >
        <ChevronRight size={16} />
      </Button>
    </div>
  )
}
