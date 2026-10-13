import React from "react"
import clsx from "clsx"
import { EyeOff, Globe, Lock, User } from "lucide-react"

import type {
  Character,
  EntityDetailData,
  Faction,
  Location,
  Visibility,
} from "@/types"

import s from "./style.module.css"

const VISIBILITY: Record<
  Visibility,
  { label: string; icon: typeof Globe; className: string }
> = {
  public: { label: "Public", icon: Globe, className: s.visibilityPublic },
  private: { label: "Private", icon: Lock, className: s.visibilityPrivate },
  secret: { label: "Secret", icon: EyeOff, className: s.visibilitySecret },
}

function getSubtitle(data: EntityDetailData): string {
  if (data.type === "characters") {
    const character = data.entity as Character
    return [character.species, character.class].filter(Boolean).join(" • ")
  }

  if (data.type === "locations") {
    const location = data.entity as Location
    return [location.type, location.sub_type].filter(Boolean).join(" • ")
  }

  return (data.entity as Faction).alignment ?? ""
}

/**
 * The public identity band at the top of the detail view: name, type-specific
 * sub-header, visibility/tag badges, and a character status indicator.
 */
export default function EntityHeader({ data }: { data: EntityDetailData }) {
  const { entity, type } = data
  const subtitle = getSubtitle(data)
  const visibility = VISIBILITY[entity.visibility]
  const VisibilityIcon = visibility.icon
  const isDeceased = type === "characters" && (entity as Character).is_deceased

  return (
    <header className={s.header}>
      <div className={s.headerMain}>
        {type === "characters" && (
          <div className={s.avatar} aria-hidden>
            <User size={36} />
          </div>
        )}

        <div className={s.titleGroup}>
          <h1 className={s.title}>{entity.name}</h1>
          {subtitle && <p className={s.subtitle}>{subtitle}</p>}

          <div className={s.badges}>
            <span className={clsx(s.badge, visibility.className)}>
              <VisibilityIcon size={12} />
              {visibility.label}
            </span>

            {type === "characters" && (
              <span
                className={clsx(
                  s.badge,
                  isDeceased ? s.deceasedBadge : s.aliveBadge,
                )}
              >
                {isDeceased ? "Deceased" : "Alive"}
              </span>
            )}

            {entity.tags?.map((tag) => (
              <span key={tag} className={clsx(s.badge, s.tagBadge)}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
