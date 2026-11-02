import React from "react"
import { redirect } from "next/navigation"

import { getViewerOrNull } from "@/server/auth"
import { getCampaignContext } from "@/server/campaigns"

import AppShell from "../app-shell"

/**
 * The gated area. Every route inside `(core)` requires a verified viewer; an
 * unauthenticated request is redirected to the sign-in dialog rather than
 * rendering the page without its shell.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const viewer = await getViewerOrNull()
  if (!viewer) redirect("/login")

  const { campaigns, active } = await getCampaignContext()

  return (
    <AppShell
      role={viewer.role}
      actualRole={viewer.actualRole ?? viewer.role}
      campaigns={campaigns}
      activeCampaignId={active?.id ?? null}
    >
      {children}
    </AppShell>
  )
}
