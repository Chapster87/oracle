import { createClient } from "@supabase/supabase-js";
import { WorldLore } from "../types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Fetches all world lore entries accessible to the current user.
 *
 * @param role - The current user's role (DM or PLAYER).
 * @param userId - The current user's ID.
 * @returns A promise resolving to an array of WorldLore entries.
 */
export async function getLoreEntries(
  role: string,
  userId: string,
): Promise<WorldLore[]> {
  let query = supabase
    .from("world_lore")
    .select("*")
    .order("name", { ascending: true });

  if (role !== "DM") {
    // Players see public lore OR lore they own
    query = query.or(`visibility.eq.public,owner_id.eq.${userId}`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching lore entries:", error);
    return [];
  }

  return data as WorldLore[];
}
