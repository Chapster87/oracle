import React from "react"
import Link from "next/link"
import clsx from "clsx"
import { EyeOff, Globe, Lock } from "lucide-react"

import type { EntitySummary, Visibility } from "@/types"
import { entityPath } from "@/utils/entity"

import s from "./style.module.css"

const VISIBILITY: Record<
  Visibility,
  { label: string; icon: typeof Globe; className: string }
> = {
  public: { label: "Public", icon: Globe, className: s.visibilityPublic },
  private: { label: "Private", icon: Lock, className: s.visibilityPrivate },
  secret: { label: "Secret", icon: EyeOff, className: s.visibilitySecret },
}

/**
 * Browse grid for a single entity type: each card links through to that
 * entity's Layered Detail view.
 */
export default function EntityDirectory({
  items,
}: {
  items: EntitySummary[]
}) {
  if (items.length === 0) {
    return <p className={s.empty}>Nothing to show here yet.</p>
  }

  return (
    <div className={s.grid}>
      {items.map((item) => {
        const visibility = VISIBILITY[item.visibility]
        const VisibilityIcon = visibility.icon

        return (
          <Link
            key={item.id}
            href={entityPath(item.type, item.id)}
            className={s.card}
          >
            <div className={s.cardHeader}>
              <h3 className={s.cardTitle}>{item.name}</h3>
              <span className={clsx(s.badge, visibility.className)}>
                <VisibilityIcon size={10} />
                {visibility.label}
              </span>
            </div>

            {item.subtitle && <p className={s.subtitle}>{item.subtitle}</p>}

            {item.tags.length > 0 && (
              <div className={s.tags}>
                {item.tags.map((tag) => (
                  <span key={tag} className={s.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </Link>
        )
      })}
    </div>
  )
}
