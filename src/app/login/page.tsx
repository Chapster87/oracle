import Heading from "@components/heading"
import Text from "@components/text"

import LoginForm from "./login-form"
import s from "./style.module.css"

/**
 * The sign-in dialog. `proxy.ts` sends every unauthenticated request here, and
 * the root layout renders it without the app shell, so nothing of the app is
 * visible before a login.
 */
export default function LoginPage() {
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
