import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerClient } from "@supabase/ssr"

import type { Role } from "@/types"

import type { Viewer } from "./rbac"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/** Set while a DM/ADMIN previews the player view. */
export const VIEW_AS_COOKIE = "oracle_view_as"

/**
 * The cookie-bound Supabase client. Reads and writes run as the signed-in user,
 * so RLS applies. The service-role client is reserved for the MCP bridge and
 * migrations.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Server Components cannot set cookies; `proxy.ts` refreshes instead.
        }
      },
    },
  })
}

/**
 * The verified viewer, or null when there is no session.
 *
 * A first-time OAuth user has no profile row yet, so one is created as a
 * player. A DM/ADMIN who has switched on the player preview is downgraded here,
 * server-side, so every read is filtered exactly as a player's would be.
 */
export async function getViewerOrNull(): Promise<Viewer | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.getClaims()

  const userId = data?.claims?.sub
  if (error || !userId) return null

  const { data: existing } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle()

  let profile = existing

  if (!profile) {
    const { data: created } = await supabase
      .from("profiles")
      .insert({ id: userId, role: "PLAYER" })
      .select("role")
      .maybeSingle()

    profile = created
  }

  const actualRole = (profile?.role as Role | undefined) ?? "PLAYER"
  const canPreview = actualRole === "DM" || actualRole === "ADMIN"

  const cookieStore = await cookies()
  const previewing = cookieStore.get(VIEW_AS_COOKIE)?.value === "player"

  return {
    userId,
    role: canPreview && previewing ? "PLAYER" : actualRole,
    actualRole,
  }
}

/** The verified viewer. Redirects to the sign-in dialog when unauthenticated. */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewerOrNull()
  if (!viewer) redirect("/login")
  return viewer
}

/** The verified viewer, restricted to DM/ADMIN. */
export async function requireDmViewer(): Promise<Viewer> {
  const viewer = await requireViewer()
  if (viewer.role !== "DM" && viewer.role !== "ADMIN") {
    redirect("/")
  }
  return viewer
}
