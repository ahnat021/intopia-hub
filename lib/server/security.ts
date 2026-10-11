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
