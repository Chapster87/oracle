import React from "react"
import clsx from "clsx"

import s from "./style.module.css"

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

/** Multi-line text input. */
export default function Textarea({ className, ...props }: TextareaProps) {
  return <textarea className={clsx(s.textarea, className)} {...props} />
}
