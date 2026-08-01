import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Supabase client for use on the client-side or in non-privileged server contexts.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
