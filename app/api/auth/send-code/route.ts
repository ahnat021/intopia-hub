import { NextResponse } from "next/server"
import { db, isSupabaseConfigured } from "@/lib/supabaseClient"
import { sendVerificationCode } from "@/lib/server/email"
import { EMAIL_RE, issueOtp, loginLockedUntil, normalizeEmail, notMeToken, type OtpPurpose } from "@/lib/server/security"
import { officialEmail } from "@/lib/constants"

const RESEND_COOLDOWN_MS = 60 * 1000
const HOURLY_LIMIT = 5

export async function POST(request: Request) {
  console.log("[intopia:send-code] env check", {
    supabaseConfigured: isSupabaseConfigured(),
    hasResendKey: !!process.env.RESEND_API_KEY,
  })
  if (!isSupabaseConfigured())
    return NextResponse.json(
      { error: "Database not configured: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing on the server." },
      { status: 503 },
    )
  try {
    return await handle(request)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("[intopia:send-code] unhandled error:", message)
    return NextResponse.json({ error: `Unexpected server error: ${message}` }, { status: 500 })
  }
}

async function handle(request: Request) {

  const body = (await request.json().catch(() => null)) as { email?: unknown; purpose?: unknown; teamId?: unknown } | null
  const purpose = body?.purpose
  if (purpose !== "team-register" && purpose !== "admin-setup") return NextResponse.json({ error: "Invalid request." }, { status: 400 })

  let email = typeof body?.email === "string" ? normalizeEmail(body.email) : ""
  let notMeUrl: string | undefined
  if (purpose === "team-register") {
    // Team codes always go to the team's official INTOPIA inbox; any client-supplied email is ignored.
    const teamId = typeof body?.teamId === "string" ? body.teamId.slice(0, 8) : ""
    const { data: team, error: teamError } = await db().from("teams").select("id, number").eq("id", teamId).maybeSingle()
    if (teamError) return dbFailure("teams lookup", teamError.message)
    if (!team) return NextResponse.json({ error: "Unknown team." }, { status: 404 })
    const lockedUntil = await loginLockedUntil(team.id)
    if (lockedUntil)
      return NextResponse.json({ error: "Login is temporarily locked after an unauthorized-attempt report. Try again in 10 minutes." }, { status: 423 })
    email = officialEmail(team.number)
    notMeUrl = `${new URL(request.url).origin}/api/auth/not-me?team=${encodeURIComponent(team.id)}&token=${notMeToken(team.id)}`
  }
  if (!EMAIL_RE.test(email) || email.length > 254) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })

  if (purpose === "admin-setup") {
    const { count, error: adminError } = await db().from("admin_account").select("id", { count: "exact", head: true })
    if (adminError) return dbFailure("admin_account lookup", adminError.message)
    if (count) return NextResponse.json({ error: "The administrator account is already set up." }, { status: 409 })
    const allowed = process.env.ADMIN_EMAIL && normalizeEmail(process.env.ADMIN_EMAIL)
    if (allowed && allowed !== email) return NextResponse.json({ error: "This email is not authorized to administer the hub." }, { status: 403 })
  }

  const { data: recent, error: otpLookupError } = await db()
    .from("email_otps")
    .select("createdAt")
    .eq("email", email)
    .eq("purpose", purpose as OtpPurpose)
    .gte("createdAt", Date.now() - 60 * 60 * 1000)
    .order("createdAt", { ascending: false })
  if (otpLookupError) return dbFailure("email_otps lookup", otpLookupError.message)
  if (recent?.[0] && Date.now() - recent[0].createdAt < RESEND_COOLDOWN_MS)
    return NextResponse.json({ error: "Please wait a minute before requesting another code." }, { status: 429 })
  if ((recent?.length ?? 0) >= HOURLY_LIMIT)
    return NextResponse.json({ error: "Too many codes requested. Try again in an hour." }, { status: 429 })

  let code: string
  try {
    code = await issueOtp(email, purpose)
  } catch (error) {
    return dbFailure("email_otps insert", error instanceof Error ? error.message : String(error))
  }
  try {
    await sendVerificationCode(email, code, purpose, notMeUrl)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("[intopia:send-code] verification email failed:", message)
    return NextResponse.json({ error: `Failed to send email: ${message}` }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}

function dbFailure(step: string, message: string) {
  console.error(`[intopia:send-code] Supabase ${step} failed:`, message)
  return NextResponse.json({ error: `Database error (${step}): ${message}` }, { status: 500 })
}
