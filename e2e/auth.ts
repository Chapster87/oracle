import type { Page } from "@playwright/test"
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local", quiet: true })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Signs the browser in as a seeded account by generating a magic link with the
 * service role and following it. Avoids depending on email delivery.
 */
export async function signInAs(page: Page, email: string) {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: "http://localhost:3000/auth/callback" },
  })

  if (error) throw error

  await page.goto(data.properties.action_link)
  await page.waitForLoadState("networkidle")
}
