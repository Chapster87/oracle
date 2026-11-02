import { redirect } from "next/navigation"

import Heading from "@components/heading"
import Text from "@components/text"

import { getViewerOrNull } from "@/server/auth"

import LoginForm from "./login-form"
import s from "./style.module.css"

/**
 * The sign-in dialog. `proxy.ts` sends every unauthenticated request here, and
 * the root layout renders it without the app shell, so nothing of the app is
 * visible before a login.
 *
 * A signed-in visitor is sent home: the check lives here rather than only in the
 * proxy, so it holds even when the middleware's token refresh is inconclusive.
 */
export default async function LoginPage() {
  const viewer = await getViewerOrNull()
  if (viewer) redirect("/")

  return (
    <div className={s.backdrop}>
      <div className={s.dialog}>
        <Heading level="h1" display="h4">
          Oracle
        </Heading>
        <Text className={s.intro}>
          Sign in to view the campaign. Your account&apos;s role decides what
          you can see.
        </Text>

        <LoginForm />
      </div>
    </div>
  )
}
