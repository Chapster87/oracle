import React from "react";
import { getLoreEntries } from "../../server/lore";
import KnowledgeBase from "../../components/KnowledgeBase/KnowledgeBase";

// Mocking auth/role for the prototype
const CURRENT_ROLE = "DM";
const CURRENT_USER_ID = "4ce7ae1c-9681-4686-8019-5228d6e35ce7";

/**
 * World Knowledge Base page.
 * Server component that fetches lore entries and renders the directory.
 */
export default async function WorldPage() {
  const entries = await getLoreEntries(CURRENT_ROLE, CURRENT_USER_ID);

  return (
    <div
      style={{
        padding: "24px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      <header>
        <h1 style={{ fontSize: "32px", fontWeight: "bold", margin: 0 }}>
          Knowledge Base
        </h1>
        <p style={{ color: "var(--muted-foreground)", marginTop: "8px" }}>
          Explore the global lore and secrets of the world.
        </p>
      </header>

      <KnowledgeBase entries={entries} isDM={CURRENT_ROLE === "DM"} />
    </div>
  );
}
