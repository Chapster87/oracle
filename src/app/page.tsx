"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  User,
  Map as MapIcon,
  BookOpen,
  Users,
  Settings,
  ChevronRight,
  Plus,
} from "lucide-react";
import s from "./style.module.css";

type Role = "DM" | "PLAYER";

/**
 * Main application shell prototype showcasing RBAC and Navigation.
 */
export default function AppShellPrototype() {
  const [role, setRole] = useState<Role>("PLAYER");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedRole = localStorage.getItem("oracle_prototype_role") as Role;
    if (savedRole) {
      setRole(savedRole);
    }
    setIsLoaded(true);
  }, []);

  const toggleRole = () => {
    const newRole = role === "DM" ? "PLAYER" : "DM";
    setRole(newRole);
    localStorage.setItem("oracle_prototype_role", newRole);
  };

  if (!isLoaded)
    return (
      <div
        style={{
          background: "white",
          color: "black",
          height: "100vh",
          padding: "20px",
        }}
      >
        Loading Prototype...
      </div>
    );

  const isDM = role === "DM";

  const navigation = [
    { name: "World", icon: MapIcon, color: "#2563eb" },
    { name: "Story Log", icon: BookOpen, color: "#2563eb" },
    { name: "Characters", icon: Users, color: "#2563eb" },
    { name: "Settings", icon: Settings, color: "#64748b" },
  ];

  return (
    <div className={s.container}>
      {/* Sidebar Navigation */}
      <aside className={s.sidebar}>
        <div className={s.sidebarHeader}>
          <div className={`${s.iconWrapper} ${isDM ? s.dmIcon : s.playerIcon}`}>
            <Shield size={24} style={{ color: "white" }} />
          </div>
          <div>
            <h1 className={s.logoTitle}>Oracle</h1>
            <p className={s.logoSubtitle}>Campaign Manager</p>
          </div>
        </div>

        <nav className={s.nav}>
          {navigation.map((item) => (
            <div key={item.name} className={s.navItem}>
              <div className={s.navItemContent}>
                <item.icon size={20} style={{ color: item.color }} />
                <span style={{ fontSize: "14px" }}>{item.name}</span>
              </div>
              <ChevronRight size={16} style={{ color: "#64748b" }} />
            </div>
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
              <User size={20} style={{ color: "#64748b" }} />
              <span style={{ fontWeight: "bold", fontSize: "14px" }}>
                {role} View
              </span>
            </div>
            <button onClick={toggleRole} className={s.switchButton}>
              Switch to {isDM ? "Player" : "DM"}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={s.main}>
        <header className={s.header}>
          <h2 style={{ fontWeight: "bold", margin: 0, fontSize: "16px" }}>
            Active Campaign: The Shattered Isles
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span
              className={s.badge}
              style={{
                backgroundColor: isDM ? "#991b1b" : "#1e40af",
              }}
            >
              {isDM ? "DM MODE" : "PLAYER VIEW"}
            </span>
          </div>
        </header>

        <section className={s.contentSection}>
          <div className={s.card}>
            <h3
              style={{
                fontWeight: "bold",
                fontSize: "24px",
                marginBottom: "16px",
                margin: "0 0 16px 0",
              }}
            >
              Welcome back, {isDM ? "Dungeon Master" : "Adventurer"}
            </h3>
            <p
              style={{
                color: "#64748b",
                marginBottom: "32px",
                fontSize: "16px",
              }}
            >
              {isDM
                ? "Manage your campaign, prep for the next session, and generate new content for your world."
                : "Explore the lore of the Shattered Isles, track your quests, and review the journey so far."}
            </p>

            <div className={s.grid}>
              <div className={s.infoCard}>
                <h4
                  style={{
                    fontWeight: "bold",
                    marginBottom: "8px",
                    margin: "0 0 8px 0",
                  }}
                >
                  Latest Story Log
                </h4>
                <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                  Episode 24: The Kraken's Wake
                </p>
              </div>
              <div className={s.infoCard}>
                <h4
                  style={{
                    fontWeight: "bold",
                    marginBottom: "8px",
                    margin: "0 0 8px 0",
                  }}
                >
                  Active Quests
                </h4>
                <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                  Find the Sapphire Shard (3/4)
                </p>
              </div>
              {isDM && (
                <div className={s.dmNoteCard}>
                  <h4 className={s.dmNoteTitle}>DM Note (Hidden)</h4>
                  <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
                    The merchant is actually a Doppelganger.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Floating UI Variant Bar (Prototype Control) */}
      <div className={s.floatingBarContainer}>
        <div className={s.floatingBar}>
          <span
            style={{ fontWeight: "bold", fontSize: "12px", color: "black" }}
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
  );
}
