import "server-only"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Service-role Supabase client. Every table has RLS enabled with no policies, so the
 * public anon key can read nothing; all access is brokered by server actions that
 * authorize the caller from a signed session cookie before touching the database.
 */
let client: SupabaseClient | null = null

export function isSupabaseConfigured() {
  return Boolean((process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export function db(): SupabaseClient {
  if (client) return client
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase is not configured")
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  return client
}
