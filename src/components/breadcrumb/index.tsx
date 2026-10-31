"use client"

import React, { useMemo } from "react"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"

import Link from "@components/link"

import s from "./styles.module.css"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  /**
   * Maps a dynamic path segment (e.g. an entity id) to its display label.
   */
  dynamicSegments?: Record<string, string>
}

/**
 * Derives a breadcrumb trail from the current pathname. Every segment except
 * the last is a link; the last is marked as the current page.
 */
export default function Breadcrumb({
  dynamicSegments,
}: BreadcrumbProps): React.ReactElement {
  const pathname = usePathname()

  const breadcrumbs: BreadcrumbItem[] = useMemo(() => {
    if (!pathname) {
      return [{ label: "Home", href: "/" }]
    }

    const pathSegments = pathname.split("/").filter(Boolean)
    const homeBreadcrumb: BreadcrumbItem = { label: "Home", href: "/" }

    const dynamicBreadcrumbs = pathSegments.map((segment, index) => {
      const href = "/" + pathSegments.slice(0, index + 1).join("/")
      const label =
        dynamicSegments && dynamicSegments[segment]
          ? dynamicSegments[segment]
          : segment
              .replace(/-/g, " ")
              .split(" ")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")

      return { label, href }
    })

    return [homeBreadcrumb, ...dynamicBreadcrumbs]
  }, [pathname, dynamicSegments])

  return (
    <nav aria-label="Breadcrumbs">
      <ol className={s.breadcrumbsList}>
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={`${breadcrumb.href}-${index}`} className={s.breadcrumbItem}>
            {breadcrumb.href && index < breadcrumbs.length - 1 ? (
              <Link href={breadcrumb.href} className={s.breadcrumbLink}>
                {breadcrumb.label}
              </Link>
            ) : (
              <span className={s.currentBreadcrumb}>{breadcrumb.label}</span>
            )}
            {index < breadcrumbs.length - 1 && (
              <span className={s.separator} aria-hidden="true">
                <ChevronRight size={18} className={s.separatorIcon} />
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
