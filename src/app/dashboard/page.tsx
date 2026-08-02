"use client"

import React from "react"
import s from "./style.module.css"
import Link from "next/link"

export default function CampaignDashboard() {
  return (
    <div className={s.container}>
      <h2
        style={{ fontWeight: "bold", fontSize: "24px", marginBottom: "24px" }}
      >
        Dashboard
      </h2>

      <div className={s.grid}>
        {/* Quest Tracker Widget */}
        <div className={s.card}>
          <div className={s.cardTitle}>
            <span>Quests</span>
            <Link href="/quests" className={s.link}>
              See All Quests
            </Link>
          </div>
          <div className={s.widgetItem}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Find the Sapphire Shard</span>
              <span className={`${s.statusBadge} ${s.statusThick}`}>
                In the Thick of It
              </span>
            </div>
          </div>
          <div className={s.widgetItem}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Escort the Merchant</span>
              <span className={`${s.statusBadge} ${s.statusWhispers}`}>
                Whispers
              </span>
            </div>
          </div>
          <div className={s.widgetItem}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Restore the Old Tower</span>
              <span className={`${s.statusBadge} ${s.statusCompleted}`}>
                Completed
              </span>
            </div>
          </div>
          <div className={s.widgetItem}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Explore the Sunken Crypt</span>
              <span className={`${s.statusBadge} ${s.statusDormant}`}>
                Dormant
              </span>
            </div>
          </div>
        </div>

        {/* Chronicle Widget (Episodes) */}
        <div className={s.card}>
          <div className={s.cardTitle}>
            <span>Recent Episodes</span>
            <Link href="/story-log" className={s.link}>
              See All Episodes
            </Link>
          </div>
          <div className={s.widgetItem}>
            <strong>Episode 24: The Kraken's Wake</strong>
            <p
              style={{
                color: "var(--muted-foreground)",
                fontSize: "14px",
                marginTop: "4px",
              }}
            >
              The party narrowly escaped the depths...
            </p>
          </div>
          <div className={s.widgetItem}>
            <strong>Episode 23: Whispers in the Dark</strong>
            <p
              style={{
                color: "var(--muted-foreground)",
                fontSize: "14px",
                marginTop: "4px",
              }}
            >
              Investigating the tavern rumors...
            </p>
          </div>
        </div>

        {/* Roster & Map Widget */}
        <div className={s.card}>
          <div className={s.cardTitle}>
            <span>Roster & Map</span>
          </div>
          <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
            <Link href="/characters" className={s.link}>
              View Characters
            </Link>
            <Link href="/world" className={s.link}>
              View Map
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
