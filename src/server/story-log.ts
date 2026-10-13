import type { StoryLogEntry } from "@/types"

import { supabaseAdmin as supabase } from "./supabase"

/**
 * Fetches Story Log entries visible to the viewer, newest first. Applies the
 * same RBAC rule as the entity views: players see public entries or their own.
 */
export async function getStoryLog(
  role: string,
  userId: string
): Promise<StoryLogEntry[]> {
  const { data, error } = await supabase
    .from("campaign_logs")
    .select("id, name, content, created_at, visibility, owner_id")
    .order("created_at", { ascending: false })

  if (error || !data) return []

  const isDM = role === "DM"

  return data
    .filter(
      (entry) =>
        isDM || entry.visibility === "public" || entry.owner_id === userId
    )
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      content: entry.content,
      created_at: entry.created_at,
    }))
}
