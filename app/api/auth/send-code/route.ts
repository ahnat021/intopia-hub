import { NextResponse } from "next/server"
import { db, isSupabaseConfigured } from "@/lib/supabaseClient"
import { sendVerificationCode } from "@/lib/server/email"
import { EMAIL_RE, issueOtp, normalizeEmail, type OtpPurpose } from "@/lib/server/security"

const RESEND_COOLDOWN_MS = 60 * 1000
const HOURLY_LIMIT = 5

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "The hub database is not connected yet." }, { status: 503 })

  const body = (await request.json().catch(() => null)) as { email?: unknown; purpose?: unknown } | null
  const email = typeof body?.email === "string" ? normalizeEmail(body.email) : ""
  const purpose = body?.purpose
  if (!EMAIL_RE.test(email) || email.length > 254) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })
  if (purpose !== "team-register" && purpose !== "admin-setup") return NextResponse.json({ error: "Invalid request." }, { status: 400 })

  if (purpose === "admin-setup") {
    const { count } = await db().from("admin_account").select("id", { count: "exact", head: true })
    if (count) return NextResponse.json({ error: "The administrator account is already set up." }, { status: 409 })
    const allowed = process.env.ADMIN_EMAIL && normalizeEmail(process.env.ADMIN_EMAIL)
    if (allowed && allowed !== email) return NextResponse.json({ error: "This email is not authorized to administer the hub." }, { status: 403 })
  } else {
    const { data: taken } = await db().from("teams").select("id").eq("email", email).maybeSingle()
    if (taken) return NextResponse.json({ error: "This email is already linked to a team." }, { status: 409 })
  }

  const { data: recent } = await db()
    .from("email_otps")
    .select("createdAt")
    .eq("email", email)
    .eq("purpose", purpose as OtpPurpose)
    .gte("createdAt", Date.now() - 60 * 60 * 1000)
    .order("createdAt", { ascending: false })
  if (recent?.[0] && Date.now() - recent[0].createdAt < RESEND_COOLDOWN_MS)
    return NextResponse.json({ error: "Please wait a minute before requesting another code." }, { status: 429 })
  if ((recent?.length ?? 0) >= HOURLY_LIMIT)
    return NextResponse.json({ error: "Too many codes requested. Try again in an hour." }, { status: 429 })

  try {
    const code = await issueOtp(email, purpose)
    await sendVerificationCode(email, code, purpose)
  } catch (error) {
    console.error("[intopia] verification email failed:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "We couldn't send the code. Please try again shortly." }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
