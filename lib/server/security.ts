import "server-only"
import { createHmac, randomBytes, randomInt, scrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"
import { db } from "@/lib/supabaseClient"

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>

export async function hashSecret(plain: string) {
  const salt = randomBytes(16)
  const hash = await scryptAsync(plain, salt, 64)
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`
}

export async function verifySecret(plain: string, stored: string) {
  const [scheme, salt, hash] = stored.split("$")
  if (scheme !== "scrypt" || !salt || !hash) return false
  const expected = Buffer.from(hash, "base64")
  const actual = await scryptAsync(plain, Buffer.from(salt, "base64"), expected.length)
  return timingSafeEqual(expected, actual)
}

export const newId = (prefix: string) => `${prefix}-${randomBytes(4).toString("hex").toUpperCase()}`

export const MAX_FAILED_ATTEMPTS = 5
export const LOCKOUT_MS = 5 * 60 * 1000

export type OtpPurpose = "team-register" | "admin-setup"
const OTP_TTL_MS = 10 * 60 * 1000
const OTP_MAX_ATTEMPTS = 5

function otpHash(email: string, purpose: OtpPurpose, code: string) {
  const key = process.env.SESSION_SECRET || process.env.SUPABASE_JWT_SECRET || ""
  return createHmac("sha256", key).update(`${purpose}:${email}:${code}`).digest("hex")
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase()
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function issueOtp(email: string, purpose: OtpPurpose) {
  const code = String(randomInt(100000, 1000000))
  const { error } = await db()
    .from("email_otps")
    .insert({ email, purpose, codeHash: otpHash(email, purpose, code), expiresAt: Date.now() + OTP_TTL_MS })
  if (error) throw new Error(error.message)
  return code
}

export const INTRUSION_LOCK_MS = 10 * 60 * 1000
const NOT_ME_TTL_MS = 60 * 60 * 1000

const secretKey = () => process.env.SESSION_SECRET || process.env.SUPABASE_JWT_SECRET || ""

export function notMeToken(teamId: string) {
  const exp = Date.now() + NOT_ME_TTL_MS
  return `${exp}.${createHmac("sha256", secretKey()).update(`notme:${teamId}:${exp}`).digest("hex")}`
}

export function verifyNotMeToken(teamId: string, token: string) {
  const [expRaw, sig] = token.split(".")
  const exp = Number(expRaw)
  if (!sig || !Number.isFinite(exp) || exp < Date.now()) return false
  const expected = Buffer.from(createHmac("sha256", secretKey()).update(`notme:${teamId}:${exp}`).digest("hex"))
  const given = Buffer.from(sig)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

/** Burns the team's pending code, locks logins for 10 minutes and flags the team for the admin. */
export async function reportIntrusion(teamId: string) {
  const { data: team } = await db().from("teams").select("id, number, security_flag_count").eq("id", teamId).maybeSingle()
  if (!team) return false
  const email = `ott${String(team.number).padStart(2, "0")}@intopsim.com`
  await db().from("email_otps").update({ attempts: 999 }).eq("email", email).is("verifiedAt", null)
  await db()
    .from("teams")
    .update({
      login_locked_until: Date.now() + INTRUSION_LOCK_MS,
      security_flag_count: (team.security_flag_count ?? 0) + 1,
      last_intrusion_reported_at: new Date().toISOString(),
    })
    .eq("id", teamId)
  return true
}

export async function loginLockedUntil(teamId: string) {
  const { data } = await db().from("teams").select("login_locked_until").eq("id", teamId).maybeSingle()
  const until = data?.login_locked_until as number | null | undefined
  return until && until > Date.now() ? until : null
}

/** Checks the most recent code for this inbox; burns it on success and counts failed guesses. */
export async function consumeOtp(email: string, purpose: OtpPurpose, code: string) {
  const { data } = await db()
    .from("email_otps")
    .select("id, codeHash, expiresAt, attempts, verifiedAt")
    .eq("email", email)
    .eq("purpose", purpose)
    .order("createdAt", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!data || data.verifiedAt || data.expiresAt < Date.now() || data.attempts >= OTP_MAX_ATTEMPTS) return false
  const given = Buffer.from(otpHash(email, purpose, code))
  const expected = Buffer.from(data.codeHash)
  const ok = given.length === expected.length && timingSafeEqual(given, expected)
  await db()
    .from("email_otps")
    .update(ok ? { verifiedAt: Date.now() } : { attempts: data.attempts + 1 })
    .eq("id", data.id)
  return ok
}
