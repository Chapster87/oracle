"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import Switcher from "./_components/switcher"
import VariantC from "./_components/variant-c"
import VariantC1 from "./_components/variant-c1"
import VariantC2 from "./_components/variant-c2"

const VARIANTS = ["C", "C1", "C2"] as const

/**
 * Throwaway UI prototype for the AI authoring surface (#68).
 *
 * Three C-shaped chat-to-review layouts, switchable with `?variant=C|C1|C2` and
 * the floating bottom bar. Read-only sample data; no mutations, no persistence.
 */
function PrototypeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const raw = (searchParams.get("variant") ?? "C").toUpperCase()
  const variant = VARIANTS.find((item) => item === raw) ?? "C"

  const setVariant = (next: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("variant", next)
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  return (
    <>
      {variant === "C" && <VariantC />}
      {variant === "C1" && <VariantC1 />}
      {variant === "C2" && <VariantC2 />}
      <Switcher variants={VARIANTS} current={variant} onChange={setVariant} />
    </>
  )
}

export default function ChatPrototypePage() {
  return (
    <Suspense fallback={null}>
      <PrototypeContent />
    </Suspense>
  )
}
