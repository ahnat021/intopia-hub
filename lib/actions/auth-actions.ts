"use server"

import { after } from "next/server"
import { headers } from "next/headers"
import { db, isSupabaseConfigured } from "@/lib/supabaseClient"
import { sendAdminKycNotice } from "@/lib/server/email"
import { clearSession, setSession } from "@/lib/server/session"
import {
  EMAIL_RE,
  LOCKOUT_MS,
  MAX_FAILED_ATTEMPTS,
  consumeOtp,
  hashSecret,
  loginLockedUntil,
  normalizeEmail,
  reportIntrusion,
  verifySecret,
} from "@/lib/server/security"
import { isProfessor, professorName, seatEmail } from "@/lib/domain"
import { findSeat, resolveSeatId } from "@/lib/server/seats"
import type { ActionResult } from "@/lib/hub-types"

const PIN_RE = /^\d{4}$/
const REGIONS = ["North America", "Europe", "China"]
const NOT_READY: ActionResult<never> = { ok: false, error: "The hub database is not connected yet." }

const clean = (s: unknown, max: number) => (typeof s === "string" ? s.trim().slice(0, max) : "")

export interface RegisterInput {
  teamId: string
  company: string
  region: string
  whatsapp: string
  email: string
  pin: string
  code: string
}

export async function registerTeam(input: RegisterInput): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_READY
  const company = clean(input.company, 80)
  const whatsapp = clean(input.whatsapp, 32)
  if (!PIN_RE.test(input.pin)) return { ok: false, error: "PIN must be exactly 4 digits." }
  if (company.length < 2) return { ok: false, error: "Enter your company name." }
  if (!REGIONS.includes(input.region)) return { ok: false, error: "Choose your home region." }
  if (!/^\+?[\d\s()-]{7,20}$/.test(whatsapp)) return { ok: false, error: "Enter a valid WhatsApp number." }

  const { team, error: seatError } = await findSeat(resolveSeatId(input.teamId, input.email))
  if (seatError) return { ok: false, error: seatError }
  if (!team) return { ok: false, error: "Unknown team." }
  if (team.kyc !== "unregistered") return { ok: false, error: "This team is already registered." }
  if (await loginLockedUntil(team.id))
    return { ok: false, error: "Login is temporarily locked after an unauthorized-attempt report. Try again in 10 minutes." }
  const email = seatEmail(team.id, team.number)
  void input.email

  if (!(await consumeOtp(email, "team-register", clean(input.code, 6))))
    return { ok: false, error: "That code is invalid or expired. Request a new one." }

  const { error: credError } = await db().from("team_credentials").insert({ teamId: team.id, pinHash: await hashSecret(input.pin) })
  if (credError) return { ok: false, error: "This team is already registered." }

  const { error } = await db()
    .from("teams")
    .update({ company, region: input.region, whatsapp, email, kyc: "pending", registeredAt: Date.now() })
    .eq("id", team.id)
    .eq("kyc", "unregistered")
  if (error) {
    await db().from("team_credentials").delete().eq("teamId", team.id)
    return { ok: false, error: error.code === "23505" ? "This email is already linked to a team." : "Registration failed. Try again." }
  }
  await setSession({ role: "team", teamId: team.id })

  const requestHeaders = await headers()
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host")
  const proto = requestHeaders.get("x-forwarded-proto") ?? "https"
  const notice = {
    teamName: isProfessor(team.id) ? professorName(team.id) : `Team ${team.number}`,
    company,
    region: input.region,
    email,
    whatsapp,
    hubUrl: host ? `${proto}://${host}/` : "https://intopiahub.com/",
  }
  after(() =>
    sendAdminKycNotice(notice).catch((e) =>
      console.error("[intopia:email] admin KYC notice failed:", e instanceof Error ? e.message : e),
    ),
  )
  return { ok: true, data: undefined }
}

/** On-screen "Not Me": only acts when a code was actually requested for this team in the last 10 minutes. */
export async function reportNotMe(teamId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_READY
  const { data: team } = await db().from("teams").select("id, number").eq("id", clean(teamId, 8)).maybeSingle()
  if (!team) return { ok: false, error: "Unknown team." }
  const { data: pending } = await db()
    .from("email_otps")
    .select("id")
    .eq("email", seatEmail(team.id, team.number))
    .is("verifiedAt", null)
    .gt("createdAt", Date.now() - 10 * 60 * 1000)
    .limit(1)
  if (!pending?.length) return { ok: false, error: "There is no pending login code for this team." }
  await reportIntrusion(team.id)
  return { ok: true, data: undefined }
}

export async function signInTeam(teamId: string, pin: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_READY
  if (!PIN_RE.test(pin)) return { ok: false, error: "Enter your 4-digit PIN." }
  const id = clean(teamId, 8)
  const [{ data: team }, { data: cred }] = await Promise.all([
    db().from("teams").select("id, banned, equity").eq("id", id).maybeSingle(),
    db().from("team_credentials").select("pinHash, failedAttempts, lockedUntil").eq("teamId", id).maybeSingle(),
  ])
  if (!team || !cred) return { ok: false, error: "This team hasn't completed setup yet." }
  if (cred.lockedUntil && cred.lockedUntil > Date.now()) return { ok: false, error: "Too many attempts. Try again in a few minutes." }

  if (!(await verifySecret(pin, cred.pinHash))) {
    const failed = cred.failedAttempts + 1
    await db()
      .from("team_credentials")
      .update(failed >= MAX_FAILED_ATTEMPTS ? { failedAttempts: 0, lockedUntil: Date.now() + LOCKOUT_MS } : { failedAttempts: failed })
      .eq("teamId", id)
    return { ok: false, error: "Incorrect PIN. Try again." }
  }
  await db().from("team_credentials").update({ failedAttempts: 0, lockedUntil: null }).eq("teamId", id)
  if (team.banned) return { ok: false, error: "This team has been removed from the hub by the administrator." }
  if (team.equity != null && Number(team.equity) < 0) return { ok: false, error: "Bankruptcy lockout: negative equity. Contact the facilitator." }
  await setSession({ role: "team", teamId: id })
  return { ok: true, data: undefined }
}

export async function signOut(): Promise<void> {
  await clearSession()
}

export async function completeAdminSetup(emailInput: string, code: string, password: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_READY
  const email = normalizeEmail(clean(emailInput, 254))
  if (password.length < 10) return { ok: false, error: "Use a password of at least 10 characters." }
  const allowed = process.env.ADMIN_EMAIL && normalizeEmail(process.env.ADMIN_EMAIL)
  if (allowed && allowed !== email) return { ok: false, error: "This email is not authorized to administer the hub." }
  const { count } = await db().from("admin_account").select("id", { count: "exact", head: true })
  if (count) return { ok: false, error: "The administrator account is already set up." }
  if (!(await consumeOtp(email, "admin-setup", clean(code, 6)))) return { ok: false, error: "That code is invalid or expired." }
  const { error } = await db().from("admin_account").insert({ id: 1, email, passwordHash: await hashSecret(password) })
  if (error) return { ok: false, error: "The administrator account is already set up." }
  await setSession({ role: "admin" })
  return { ok: true, data: undefined }
}

export async function adminSignIn(emailInput: string, password: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return NOT_READY
  const email = normalizeEmail(clean(emailInput, 254))
  const { data: admin } = await db().from("admin_account").select("email, passwordHash, failedAttempts, lockedUntil").eq("id", 1).maybeSingle()
  const denied: ActionResult = { ok: false, error: "Invalid email or password." }
  if (!admin) return denied
  if (admin.lockedUntil && admin.lockedUntil > Date.now()) return { ok: false, error: "Too many attempts. Try again in a few minutes." }
  const ok = admin.email === email && (await verifySecret(password, admin.passwordHash))
  if (!ok) {
    const failed = admin.failedAttempts + 1
    await db()
      .from("admin_account")
      .update(failed >= MAX_FAILED_ATTEMPTS ? { failedAttempts: 0, lockedUntil: Date.now() + LOCKOUT_MS } : { failedAttempts: failed })
      .eq("id", 1)
    return denied
  }
  await db().from("admin_account").update({ failedAttempts: 0, lockedUntil: null }).eq("id", 1)
  await setSession({ role: "admin" })
  return { ok: true, data: undefined }
}
