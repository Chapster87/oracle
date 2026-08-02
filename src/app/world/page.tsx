import React from "react"
import { getLoreEntries } from "../../server/lore"
import KnowledgeBase from "./_components/knowledge-base"
import s from "../style.module.css"

// Mocking auth/role for the prototype
const CURRENT_ROLE = "DM"
const CURRENT_USER_ID = "4ce7ae1c-9681-4686-8019-5228d6e35ce7"

/**
 * World Knowledge Base page.
 */
export default async function WorldPage() {
  const entries = await getLoreEntries(CURRENT_ROLE, CURRENT_USER_ID)

  return (
    <div className={s.card}>
      <header style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: "bold", margin: 0 }}>
          Knowledge Base
        </h1>
        <p style={{ color: "var(--muted-foreground)", marginTop: "8px" }}>
          Explore the global lore and secrets of the world.
        </p>
      </header>

      <KnowledgeBase entries={entries} isDM={CURRENT_ROLE === "DM"} />
    </div>
  )
}
