import React from "react"
import NextLink from "next/link"
import clsx from "clsx"

import buttonStyles from "../button/styles.module.css"
import s from "./styles.module.css"

type LinkProps = {
  children: React.ReactNode
  href: string
  variant?:
    | "primary"
    | "secondary"
    | "ghost"
    | "outline"
    | "dm"
    | "link"
    | "destructive"
  size?: "small" | "default" | "large"
  shape?: "standard" | "square" | "circle"
  className?: string
  openInNewTab?: boolean
  nofollow?: boolean
  buttonStyle?: boolean
} & React.AnchorHTMLAttributes<HTMLAnchorElement>

/**
 * Global link component. Wraps `next/link` so navigation shares the button
 * chrome when `buttonStyle` is set, and otherwise renders a plain text link.
 */
const Link: React.FC<LinkProps> = ({
  children,
  href,
  variant = "primary",
  size = "default",
  shape = "standard",
  className,
  openInNewTab = false,
  nofollow = false,
  buttonStyle = false,
  ...props
}) => {
  const classes = clsx(
    buttonStyle
      ? [
          buttonStyles.base,
          buttonStyles[variant],
          buttonStyles[size],
          buttonStyles[shape],
        ]
      : s.link,
    className
  )

  return (
    <NextLink
      href={href}
      className={classes}
      target={openInNewTab ? "_blank" : undefined}
      rel={nofollow ? "noopener noreferrer" : undefined}
      {...props}
    >
      {children}
    </NextLink>
  )
}

export default Link
