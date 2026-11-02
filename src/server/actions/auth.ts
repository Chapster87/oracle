"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import {
  createSupabaseServerClient,
  getViewerOrNull,
  VIEW_AS_COOKIE,
} from "@/server/auth"

export interface SignInState {
  ok?: boolean
  error?: string
}

/** Sends a magic link to the given address. */
export async function signInAction(
  _prev: SignInState | null,
  formData: FormData
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim()
  if (!email) return { error: "Enter your email address." }

  const supabase = await createSupabaseServerClient()
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  })

  if (error) return { error: error.message }
  return { ok: true }
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect("/login")
}

/**
 * Turns the player preview on or off. The cookie is read by `getViewerOrNull`,
 * which downgrades the role server-side, so the preview shows exactly what a
 * player would see.
 */
export async function setViewAsPlayerAction(formData: FormData): Promise<void> {
  const viewer = await getViewerOrNull()
  if (!viewer) redirect("/login")

  const actualRole = viewer.actualRole ?? viewer.role
  if (actualRole !== "DM" && actualRole !== "ADMIN") {
    throw new Error("Only a DM may preview the player view")
  }

  const enabled = String(formData.get("enabled") ?? "") === "true"
  const cookieStore = await cookies()

  if (enabled) {
    cookieStore.set(VIEW_AS_COOKIE, "player", { path: "/", sameSite: "lax" })
  } else {
    cookieStore.set(VIEW_AS_COOKIE, "", { path: "/", maxAge: 0 })
  }

  revalidatePath("/", "layout")
}
