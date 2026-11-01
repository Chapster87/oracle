import React from "react"
import { Eye, EyeOff, Globe } from "lucide-react"
import clsx from "clsx"

import { hasContent } from "./has-content"
import s from "./style.module.css"

/** How visible the content is: DM-only, shared with the owner, or public. */
export type PrivateLogTone = "hidden" | "shared" | "revealed"

interface PrivateLogProps {
  title?: string
  tone?: PrivateLogTone
  children?: React.ReactNode
}

const ICONS = {
  hidden: EyeOff,
  shared: Eye,
  revealed: Globe,
} as const

/**
 * The "Private Log" treatment for withheld content (Research #10). The tone
 * carries the audience: burgundy for DM-only, amber for owner, green once the
 * content is public.
 */
export default function PrivateLog({
  title = "DM Note (Hidden)",
  tone = "hidden",
  children,
}: PrivateLogProps) {
  const Icon = ICONS[tone]

  return (
    <section
      className={clsx(
        s.privateLog,
        tone === "shared" && s.privateLogShared,
        tone === "revealed" && s.privateLogRevealed
      )}
    >
      <div className={s.privateLogHeader}>
        <Icon size={16} />
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
