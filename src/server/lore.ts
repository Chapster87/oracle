import type { WorldLore } from "@/types"

import { createSupabaseServerClient } from "./auth"
import { isDmRole } from "./rbac"

/**
 * Fetches all world lore entries accessible to the current user.
 *
 * Runs as the signed-in user, so RLS is the outer gate; the explicit filter
 * keeps the TypeScript predicate and the policy in step.
 */
export async function getLoreEntries(
  role: string,
  userId: string
): Promise<WorldLore[]> {
  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from("world_lore")
    .select("*")
    .order("name", { ascending: true })

  if (!isDmRole(role)) {
    query = query.or(`visibility.eq.public,owner_id.eq.${userId}`)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching lore entries:", error)
    return []
  }

  return data as WorldLore[]
}
