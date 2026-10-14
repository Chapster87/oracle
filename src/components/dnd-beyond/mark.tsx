import React from "react"

/**
 * The D&D Beyond brand mark: a stylised d20 (a pointy-top hexagon with its two
 * inscribed face triangles), drawn inline so it inherits `currentColor` and
 * needs no icon dependency.
 */
export default function DndBeyondMark({
  size = 28,
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      {...props}
    >
      <path d="M12 2 20.66 7v10L12 22 3.34 17V7Z" />
      <path d="M12 2 3.34 17h17.32Z" />
      <path d="M12 22 20.66 7H3.34Z" />
    </svg>
  )
}
