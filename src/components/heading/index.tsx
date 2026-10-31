import React from "react"
import clsx from "clsx"

import s from "./style.module.css"

type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6"

type HeadingProps = {
  level: HeadingLevel
  /** Visual size, independent of the semantic tag. Defaults to `level`. */
  display?: HeadingLevel
  children?: React.ReactNode
  className?: string
} & React.ComponentPropsWithoutRef<HeadingLevel>

/**
 * Semantic heading with an independent visual size. `level` picks the tag;
 * `display` picks the size from the global heading scale.
 */
export default function Heading({
  level,
  display = level,
  children,
  className,
  ...props
}: HeadingProps) {
  const Component = level

  return (
    <Component
      className={clsx(
        {
          [s.h1]: display === "h1",
          [s.h2]: display === "h2",
          [s.h3]: display === "h3",
          [s.h4]: display === "h4",
          [s.h5]: display === "h5",
          [s.h6]: display === "h6",
        },
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}
