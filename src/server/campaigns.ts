import { cookies } from "next/headers"

import { createSupabaseServerClient } from "./auth"

/** Set by the header selector; validated against the viewer's visible list. */
export const ACTIVE_CAMPAIGN_COOKIE = "oracle_campaign"

export interface CampaignSummary {
  id: string
  name: string
}

/**
 * The campaigns the viewer may see, and the one currently selected.
 *
 * The list comes through the user-scoped client, so RLS decides visibility:
 * ADMIN sees every campaign, a DM sees the ones they run or belong to. The
 * cookie is only a preference — an unknown or forbidden id falls back to the
 * first visible campaign.
 */
export async function getCampaignContext(): Promise<{
  campaigns: CampaignSummary[]
  active: CampaignSummary | null
}> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from("campaigns")
    .select("id, name")
    .order("name")

  const campaigns = (data ?? []) as CampaignSummary[]
  if (campaigns.length === 0) return { campaigns, active: null }

  const cookieStore = await cookies()
  const selected = cookieStore.get(ACTIVE_CAMPAIGN_COOKIE)?.value

  return {
    campaigns,
    active: campaigns.find((campaign) => campaign.id === selected) ?? campaigns[0],
  }
}
