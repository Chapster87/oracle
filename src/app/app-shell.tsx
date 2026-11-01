"use client"

import React, { useEffect, useState } from "react"
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
  Settings,
  ChevronRight,
  Plus,
} from "lucide-react"

import Button from "@components/button"
import Heading from "@components/heading"
import Text from "@components/text"

import type { Role } from "@/types"

import s from "./style.module.css"

/** Prototype role cycle. ADMIN sees everything a DM does. */
const ROLE_CYCLE: Role[] = ["DM", "PLAYER", "ADMIN"]

/**
 * The interactive app shell: sidebar, role toggle, and main content frame.
 *
 * Kept as a client component so the root layout can stay a server component —
 * a client root layout that returns `<html>`/`<body>` breaks hydration because
 * Next.js injects its streaming script into the body.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("PLAYER")
  const pathname = usePathname()

  useEffect(() => {
    const savedRole = localStorage.getItem("oracle_prototype_role")
    if (savedRole && ROLE_CYCLE.includes(savedRole as Role)) {
      setRole(savedRole as Role)
    }
  }, [])

  const nextRole =
    ROLE_CYCLE[(ROLE_CYCLE.indexOf(role) + 1) % ROLE_CYCLE.length]

  const toggleRole = () => {
    setRole(nextRole)
    localStorage.setItem("oracle_prototype_role", nextRole)
  }

  const isDM = role === "DM" || role === "ADMIN"

  const navigation = [
    { name: "Home", href: "/", icon: Shield, color: "var(--muted-foreground)" },
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Shield,
      color: "var(--color-blue)",
    },
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
            <Button variant="outline" size="small" onClick={toggleRole}>
              Switch to {nextRole}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={s.main}>
        <header className={s.header}>
          <Heading level="h2" display="h6">
            Active Campaign: The Shattered Isles
          </Heading>
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

      {/* Floating UI Variant Bar (Prototype Control) */}
      <div className={s.floatingBarContainer}>
        <div className={s.floatingBar}>
          <span
            style={{
              fontWeight: "bold",
              fontSize: "12px",
              color: "var(--color-black)",
            }}
          >
            PROTOTYPE: App Shell UI
          </span>
          <div className={s.separator} />
          <Button variant="link" onClick={toggleRole}>
            Switch to {isDM ? "Player UI" : "DM UI"}
          </Button>
        </div>
      </div>
    </div>
  )
}
