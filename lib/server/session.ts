import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

const COOKIE = "ih_session"
const TTL_MS = 1000 * 60 * 60 * 12

export type Session = { role: "team"; teamId: string; exp: number } | { role: "admin"; exp: number }
type SessionInput = { role: "team"; teamId: string } | { role: "admin" }

function secret() {
  const value = process.env.SESSION_SECRET || process.env.SUPABASE_JWT_SECRET
  if (!value) throw new Error("Session secret is not configured")
  return value
}

const sign = (body: string) => createHmac("sha256", secret()).update(body).digest("base64url")

function decode(token: string): Session | null {
  const [body, sig] = token.split(".")
  if (!body || !sig) return null
  const expected = Buffer.from(sign(body))
  const given = Buffer.from(sig)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
  try {
    const session = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Session
    return session.exp > Date.now() ? session : null
  } catch {
    return null
  }
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  try {
    return decode(token)
  } catch {
    return null
  }
}

export async function setSession(input: SessionInput) {
  const session = { ...input, exp: Date.now() + TTL_MS }
  const body = Buffer.from(JSON.stringify(session)).toString("base64url")
  ;(await cookies()).set(COOKIE, `${body}.${sign(body)}`, {
    httpOnly: true,
    secure: true,
    // "none" keeps the session working inside the v0 preview iframe.
    sameSite: "none",
    path: "/",
    maxAge: TTL_MS / 1000,
  })
}

export async function clearSession() {
  ;(await cookies()).set(COOKIE, "", { httpOnly: true, secure: true, sameSite: "none", path: "/", maxAge: 0 })
}
