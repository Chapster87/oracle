import React from "react"
import clsx from "clsx"

import s from "./style.module.css"

type TextProps = {
  variant?: "p" | "span" | "div"
  size?: "sm" | "default" | "lg"
  children?: React.ReactNode
  className?: string
  dangerouslySetInnerHTML?: { __html: string }
}

/**
 * Body text with a semantic element (`variant`) and a size step (`size`).
 */
export default function Text({
  variant = "p",
  size = "default",
  children,
  className,
  dangerouslySetInnerHTML,
  ...props
}: TextProps) {
  const Component = variant

  return (
    <Component
      className={clsx(
        {
          [s.smallText]: size === "sm",
          [s.defaultText]: size === "default",
          [s.largeText]: size === "lg",
        },
        className
      )}
      {...props}
      dangerouslySetInnerHTML={dangerouslySetInnerHTML}
    >
      {children}
    </Component>
  )
}
