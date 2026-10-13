import React from "react"
import { EyeOff } from "lucide-react"

import { hasContent } from "./has-content"
import s from "./style.module.css"

interface PrivateLogProps {
  title?: string
  children?: React.ReactNode
}

/**
 * The "Private Log" treatment for DM-only content (Research #10): light red
 * background, burgundy border, and a persistent hidden-from-players label.
 */
export default function PrivateLog({
  title = "DM Note (Hidden)",
  children,
}: PrivateLogProps) {
  return (
    <section className={s.privateLog}>
      <div className={s.privateLogHeader}>
        <EyeOff size={16} />
        <span className={s.privateLogLabel}>{title}</span>
      </div>
      <div className={s.privateLogBody}>
        {hasContent(children) ? (
          children
        ) : (
          <span className={s.empty}>No DM notes recorded.</span>
        )}
      </div>
    </section>
  )
}
