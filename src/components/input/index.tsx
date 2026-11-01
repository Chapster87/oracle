import React from "react"
import clsx from "clsx"

import s from "./style.module.css"

type InputProps = {
  icon?: React.ReactNode
} & React.InputHTMLAttributes<HTMLInputElement>

/**
 * Single-line text input. An optional leading icon is rendered inside the
 * field without overlapping the text.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { icon, className, ...props },
  ref
) {
  if (!icon) {
    return <input ref={ref} className={clsx(s.input, className)} {...props} />
  }

  return (
    <div className={s.wrapper}>
      <span className={s.icon} aria-hidden="true">
        {icon}
      </span>
      <input
        ref={ref}
        className={clsx(s.input, s.withIcon, className)}
        {...props}
      />
    </div>
  )
})

export default Input
