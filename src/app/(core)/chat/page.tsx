export const metadata = { title: "Chat" }

import React from "react"

import { LANES } from "@/server/agent/lanes"
import { requireDmViewer } from "@/server/auth"
import { getCampaignContext } from "@/server/campaigns"

import Chat from "./_components/chat"
import s from "../../style.module.css"

/** The DM-only authoring chat. */
export default async function ChatPage() {
  await requireDmViewer()
  const { active } = await getCampaignContext()

  return (
    <div className={s.card}>
      <Chat
        lanes={LANES.map(({ id, label, description }) => ({
          id,
          label,
          description,
        }))}
        campaignName={active?.name ?? null}
      />
    </div>
  )
}
