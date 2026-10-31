import React from "react"
import Link from "@components/link"
import Heading from "@components/heading"
import Text from "@components/text"
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
export default function EntityDirectory({ items }: { items: EntitySummary[] }) {
  if (items.length === 0) {
    return <Text className={s.empty}>Nothing to show here yet.</Text>
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
              <Heading level="h3" className={s.cardTitle}>
                {item.name}
              </Heading>
              <span className={clsx(s.badge, visibility.className)}>
                <VisibilityIcon size={10} />
                {visibility.label}
              </span>
            </div>

            {item.subtitle && (
              <Text className={s.subtitle}>{item.subtitle}</Text>
            )}

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
