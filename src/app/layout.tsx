"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Shield,
  User,
  Map as MapIcon,
  MapPin,
  Flag,
  BookOpen,
  Users,
  Settings,
  ChevronRight,
  Plus,
} from "lucide-react"
import "../styles/globals.css"
import s from "./style.module.css"
import Button from "@components/button"

type Role = "DM" | "PLAYER"

/**
 * Root layout component for the application.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [role, setRole] = useState<Role>("PLAYER")
  const [isLoaded, setIsLoaded] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const savedRole = localStorage.getItem("oracle_prototype_role") as Role
    if (savedRole) {
      setRole(savedRole)
    }
    setIsLoaded(true)
  }, [])

  const toggleRole = () => {
    const newRole = role === "DM" ? "PLAYER" : "DM"
    setRole(newRole)
    localStorage.setItem("oracle_prototype_role", newRole)
  }

  const isDM = role === "DM"

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
      href: "#",
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
      name: "Settings",
      href: "#",
      icon: Settings,
      color: "var(--muted-foreground)",
    },
  ]

  if (!isLoaded) {
    return (
      <html lang="en">
        <body
          style={{
            background: "var(--color-white)",
            color: "var(--color-black)",
            padding: "20px",
          }}
        >
          Loading Oracle...
        </body>
      </html>
    )
  }

  return (
    <html lang="en">
      <body>
        <div className={s.container}>
          {/* Sidebar Navigation */}
          <aside className={s.sidebar}>
            <div className={s.sidebarHeader}>
              <div
                className={`${s.iconWrapper} ${isDM ? s.dmIcon : s.playerIcon}`}
              >
                <Shield size={24} style={{ color: "var(--color-white)" }} />
              </div>
              <div>
                <h1 className={s.logoTitle}>Oracle</h1>
                <p className={s.logoSubtitle}>Campaign Manager</p>
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
                <h3 className={s.dmToolsTitle}>DM Tools</h3>
                <button className={s.dmActionButton}>
                  <Plus size={16} />
                  <span>New Episode</span>
                </button>
              </div>
            )}

            <div
              className={s.sidebarFooter}
              style={{ marginTop: isDM ? "0" : "auto" }}
            >
              <div className={s.roleDisplay}>
                <div className={s.userInfo}>
                  <User
                    size={20}
                    style={{ color: "var(--muted-foreground)" }}
                  />
                  <span style={{ fontWeight: "bold", fontSize: "14px" }}>
                    {role} View
                  </span>
                </div>
                <Button variant="outline" size="small" onClick={toggleRole}>
                  Switch to {isDM ? "Player" : "DM"}
                </Button>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className={s.main}>
            <header className={s.header}>
              <h2 style={{ fontWeight: "bold", margin: 0, fontSize: "16px" }}>
                Active Campaign: The Shattered Isles
              </h2>
              <div
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
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
              <button onClick={toggleRole} className={s.variantLink}>
                Switch to {isDM ? "Player UI" : "DM UI"}
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
