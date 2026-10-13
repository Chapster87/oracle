import { createClient } from "@supabase/supabase-js"

/**
 * Service-role Supabase client for server-only data access. It bypasses RLS, so
 * callers are responsible for applying RBAC themselves (see `server/entities.ts`
 * and `server/story-log.ts`).
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
