import type { ReactNode } from "react"

/**
 * Whether slot content should be rendered rather than an empty state.
 * Treats `null`, `undefined`, `""`, and empty arrays as "no content".
 */
export function hasContent(children: ReactNode): boolean {
  return (
    children !== null &&
    children !== undefined &&
    children !== "" &&
    !(Array.isArray(children) && children.length === 0)
  )
}
