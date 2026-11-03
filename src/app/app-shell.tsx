"use client"

import React, { useTransition } from "react"
import Link from "@components/link"
import { usePathname } from "next/navigation"
import {
  Shield,
  User,
  Users,
  UserRound,
  Map as MapIcon,
  MapPin,
  Flag,
  Gem,
  Church,
  BookOpen,
  ScrollText,
  Settings,
  LayoutGrid,
  ChevronRight,
  Plus,
} from "lucide-react"

import Button from "@components/button"
import Heading from "@components/heading"
import { Select, SelectItem } from "@components/select"
import Text from "@components/text"

import { setActiveCampaignAction } from "@/server/actions/campaigns"
import { setViewAsPlayerAction, signOutAction } from "@/server/actions/auth"
import type { CampaignSummary } from "@/server/campaigns"
import type { Role } from "@/types"

import s from "./style.module.css"

/**
 * The interactive app shell: sidebar, role toggle, and main content frame.
 *
 * Kept as a client component so the root layout can stay a server component —
 * a client root layout that returns `<html>`/`<body>` breaks hydration because
 * Next.js injects its streaming script into the body.
 */
export default function AppShell({
  role,
  actualRole,
  campaigns,
  activeCampaignId,
  children,
}: {
  role: Role
  actualRole: Role
  campaigns: CampaignSummary[]
  activeCampaignId: string | null
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [, startTransition] = useTransition()

  const isDM = role === "DM" || role === "ADMIN"
  const canPreview = actualRole === "DM" || actualRole === "ADMIN"
  const previewing = canPreview && role === "PLAYER"

  const navigation = [
    { name: "Home", href: "/", icon: Shield, color: "var(--muted-foreground)" },
    {
      name: "World",
      href: "/world",
      icon: MapIcon,
      color: "var(--color-blue)",
    },
    {
      name: "Story Log",
      href: "/story",
      icon: BookOpen,
      color: "var(--color-blue)",
    },
    {
      name: "Story Arcs",
      href: "/story-arcs",
      icon: ScrollText,
      color: "var(--color-blue)",
    },
    {
      name: "Characters",
      href: "/characters",
      icon: Users,
      color: "var(--color-blue)",
    },
    {
      name: "Players",
      href: "/players",
      icon: UserRound,
      color: "var(--color-blue)",
    },
    {
      name: "Locations",
      href: "/locations",
      icon: MapPin,
      color: "var(--color-blue)",
    },
    {
      name: "Factions",
      href: "/factions",
      icon: Flag,
      color: "var(--color-blue)",
    },
    {
      name: "Items",
      href: "/items",
      icon: Gem,
      color: "var(--color-blue)",
    },
    {
      name: "Religions",
      href: "/religions",
      icon: Church,
      color: "var(--color-blue)",
    },
    ...(isDM
      ? [
          {
            name: "Workbench",
            href: "/components",
            icon: LayoutGrid,
            color: "var(--color-blue)",
          },
        ]
      : []),
    {
      name: "Settings",
      href: "#",
      icon: Settings,
      color: "var(--muted-foreground)",
    },
  ]

  return (
    <div className={s.container}>
      {/* Sidebar Navigation */}
      <aside className={s.sidebar}>
        <div className={s.sidebarHeader}>
          <div className={`${s.iconWrapper} ${isDM ? s.dmIcon : s.playerIcon}`}>
            <Shield size={24} style={{ color: "var(--color-white)" }} />
          </div>
          <div>
            <Heading level="h1" display="h5" className={s.logoTitle}>
              Oracle
            </Heading>
            <Text size="sm" className={s.logoSubtitle}>
              Campaign Manager
            </Text>
          </div>
        </div>

        <nav className={s.nav}>
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`${s.navItem} ${pathname === item.href ? s.activeNavItem : ""}`}
            >
              <div className={s.navItemContent}>
                <item.icon size={20} style={{ color: item.color }} />
                <span style={{ fontSize: "14px" }}>{item.name}</span>
              </div>
              <ChevronRight
                size={16}
                style={{ color: "var(--muted-foreground)" }}
              />
            </Link>
          ))}
        </nav>

        {/* DM Specific Actions */}
        {isDM && (
          <div className={s.dmTools}>
            <Heading level="h3" display="h6" className={s.dmToolsTitle}>
              DM Tools
            </Heading>
            <Button variant="dm" className={s.dmActionButton}>
              <Plus size={16} />
              <span>New Episode</span>
            </Button>
          </div>
        )}

        <div
          className={s.sidebarFooter}
          style={{ marginTop: isDM ? "0" : "auto" }}
        >
          <div className={s.roleDisplay}>
            <div className={s.userInfo}>
              <User size={20} style={{ color: "var(--muted-foreground)" }} />
              <span style={{ fontWeight: "bold", fontSize: "14px" }}>
                {role} View
              </span>
            </div>
            <form action={signOutAction}>
              <Button type="submit" variant="outline" size="small">
                Sign out
              </Button>
            </form>
          </div>

          {canPreview && (
            <form action={setViewAsPlayerAction} style={{ marginTop: "8px" }}>
              <input
                type="hidden"
                name="enabled"
                value={previewing ? "false" : "true"}
              />
              <Button
                type="submit"
                variant={previewing ? "dm" : "outline"}
                size="small"
                style={{ width: "100%" }}
              >
                {previewing ? "Stop viewing as player" : "View as player"}
              </Button>
            </form>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={s.main}>
        <header className={s.header}>
          {campaigns.length > 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                width: "340px",
              }}
            >
              <Text
                size="sm"
                style={{
                  color: "var(--muted-foreground)",
                  whiteSpace: "nowrap",
                }}
              >
                Active campaign
              </Text>
              <Select
                value={activeCampaignId ?? undefined}
                onValueChange={(value) =>
                  startTransition(() => setActiveCampaignAction(value))
                }
                aria-label="Active campaign"
              >
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </Select>
            </div>
          ) : (
            <Heading level="h2" display="h6">
              No campaign yet
            </Heading>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span
              className={s.badge}
              style={{
                backgroundColor: isDM
                  ? "var(--dm-accent)"
                  : "var(--color-blue)",
              }}
            >
              {isDM ? "DM MODE" : "PLAYER VIEW"}
            </span>
          </div>
        </header>

        <section className={s.contentSection}>{children}</section>
      </main>
    </div>
  )
}
