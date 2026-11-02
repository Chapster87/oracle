"use client"

import { useActionState, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"

import Button from "@components/button"
import Field from "@components/field"
import Input from "@components/input"
import Text from "@components/text"

import { signInAction, type SignInState } from "@/server/actions/auth"

export default function LoginForm() {
  const [state, action] = useActionState<SignInState | null, FormData>(
    signInAction,
    null
  )
  const [googleError, setGoogleError] = useState<string | null>(null)

  // Started in the browser so the PKCE verifier cookie is written by the same
  // client that later reads it in the callback.
  const signInWithGoogle = async () => {
    setGoogleError(null)

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) setGoogleError(error.message)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Button
        type="button"
        onClick={signInWithGoogle}
        style={{ width: "100%" }}
      >
        Continue with Google
      </Button>

      {googleError && (
        <Text style={{ color: "var(--destructive)" }}>{googleError}</Text>
      )}

      <Text
        size="sm"
        style={{ textAlign: "center", color: "var(--muted-foreground)" }}
      >
        or
      </Text>

      <form
        action={action}
        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
        <Field label="Email" help="We'll email you a one-time sign-in link.">
          <Input type="email" name="email" required autoComplete="email" />
        </Field>

        {state?.error && (
          <Text style={{ color: "var(--destructive)" }}>{state.error}</Text>
        )}

        {state?.ok && <Text>Check your inbox for the sign-in link.</Text>}

        <Button type="submit" variant="outline">
          Send magic link
        </Button>
      </form>
    </div>
  )
}
