import React from "react"
import Link from "next/link"

import type { EntityDetailData } from "@/types"

import { entityLabel, entityPath, isLinkableEntity } from "@/utils/entity"

import s from "./style.module.css"

/** "member_of" -> "Member Of". */
function humanizeRelation(relationType: string): string {
  return relationType
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

/**
 * The Relationships tab: the entity's parent region (locations only) plus every
 * `entity_relations` link, resolved to a clickable entity where a route exists.
 */
export default function Relationships({ data }: { data: EntityDetailData }) {
  const { related, region } = data

  if (!region && related.length === 0) {
    return <p className={s.empty}>No relationships recorded.</p>
  }

  return (
    <div className={s.relationshipList}>
      {region && (
        <div className={s.relationshipItem}>
          <span className={s.relationshipLabel}>Region</span>
          <span className={s.relationshipValue}>
            <Link
              href={`/locations/${region.id}`}
              className={s.relationshipLink}
            >
              {region.name}
            </Link>
            <span className={s.relationshipType}>Location</span>
          </span>
        </div>
      )}

      {related.map((relation) => (
        <div
          key={`${relation.id}-${relation.relationType}`}
          className={s.relationshipItem}
        >
          <span className={s.relationshipLabel}>
            {humanizeRelation(relation.relationType)}
          </span>
          <span className={s.relationshipValue}>
            {isLinkableEntity(relation.type) ? (
              <Link
                href={entityPath(relation.type, relation.id)}
                className={s.relationshipLink}
              >
                {relation.name}
              </Link>
            ) : (
              relation.name
            )}
            <span className={s.relationshipType}>
              {isLinkableEntity(relation.type)
                ? entityLabel(relation.type)
                : "Lore"}
            </span>
          </span>
        </div>
      ))}
    </div>
  )
}
