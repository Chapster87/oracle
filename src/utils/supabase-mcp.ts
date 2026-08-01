import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "path";

// Ensure environment variables are loaded
config({ path: path.join(process.cwd(), ".env.local") });

/**
 * Creates a privileged Supabase client for MCP server usage.
 * Uses SERVICE_ROLE_KEY to bypass RLS.
 */
export function createMCPClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for MCP client",
    );
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
