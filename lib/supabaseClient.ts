import "server-only"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Service-role Supabase client. Every table has RLS enabled with no policies, so the
 * public anon key can read nothing; all access is brokered by server actions that
 * authorize the caller from a signed session cookie before touching the database.
 */
let client: SupabaseClient | null = null

const supabaseUrl = () => process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl() && serviceKey())
}

export function db(): SupabaseClient {
  if (client) return client
  const url = supabaseUrl()
  const key = serviceKey()
  if (!url || !key) throw new Error("Supabase is not configured")
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  return client
}
