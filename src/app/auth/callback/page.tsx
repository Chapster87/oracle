"use client"

import { useEffect, useRef, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"

import Text from "@components/text"

/**
 * Completes a sign-in.
 *
 * Google and the PKCE flow arrive as `?code=`; Supabase's default magic-link
 * template arrives with the session in the URL fragment, which a server route
 * cannot read. Both are finished here, in the browser, and the session cookies
 * are written by the same client.
 *
 * The exchange runs exactly once: a code is single-use, and React re-runs
 * effects in development, so a second attempt would report a failure for a
 * sign-in that actually succeeded.
 */
export default function AuthCallbackPage() {
  const [failed, setFailed] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const finish = async (error: boolean) => {
      if (!error) {
        window.location.replace("/")
        return
      }

      // If a session already exists, the sign-in did succeed — the code was
      // simply consumed by an earlier attempt.
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        window.location.replace("/")
        return
      }

      setFailed(true)
    }

    const code = new URLSearchParams(window.location.search).get("code")
    if (code) {
      supabase.auth
        .exchangeCodeForSession(code)
        .then(({ error }) => finish(Boolean(error)))
      return
    }

    const params = new URLSearchParams(window.location.hash.slice(1))
    const accessToken = params.get("access_token")
    const refreshToken = params.get("refresh_token")

    if (!accessToken || !refreshToken) {
      finish(true)
      return
    }

    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => finish(Boolean(error)))
  }, [])

  if (failed) {
    return (
      <div style={{ padding: "48px", textAlign: "center" }}>
        <Text>That sign-in link could not be completed.</Text>
        <Text size="sm">
          <a href="/login">Try again</a>
        </Text>
      </div>
    )
  }

  return (
    <div style={{ padding: "48px", textAlign: "center" }}>
      <Text>Signing you in…</Text>
    </div>
  )
}
