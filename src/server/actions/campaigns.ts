"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { createSupabaseServerClient, getViewerOrNull } from "@/server/auth"
import { ACTIVE_CAMPAIGN_COOKIE } from "@/server/campaigns"

/**
 * Switches the active campaign. The id is re-checked through the user-scoped
 * client, so a viewer cannot select a campaign RLS would not show them.
 */
export async function setActiveCampaignAction(
  campaignId: string
): Promise<void> {
  const viewer = await getViewerOrNull()
  if (!viewer) redirect("/login")

  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from("campaigns")
    .select("id")
    .eq("id", campaignId)
    .maybeSingle()

  if (!data) throw new Error("Unknown campaign")

  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_CAMPAIGN_COOKIE, campaignId, {
    path: "/",
    sameSite: "lax",
  })

  revalidatePath("/", "layout")
}
