import "server-only"
import { Resend } from "resend"
import type { OtpPurpose } from "./security"

let resend: Resend | null = null
const client = () => (resend ??= new Resend(process.env.RESEND_API_KEY))

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

const FROM_ADDRESS = "Intopia Hub <noreply@intopiahub.com>"

export async function sendVerificationCode(to: string, code: string, purpose: OtpPurpose, notMeUrl?: string) {
  console.log("[intopia:email] send requested", { purpose, hasResendKey: !!process.env.RESEND_API_KEY, from: FROM_ADDRESS })
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set in this environment")
  const subject = purpose === "admin-setup" ? "Your Intopia Hub admin setup code" : "Your Intopia Hub verification code"
  const intro =
    purpose === "admin-setup"
      ? "Use this code to finish setting up the Intopia Hub administrator account."
      : "Use this code to verify your team's email and submit your registration for review."
  let result: Awaited<ReturnType<Resend["emails"]["send"]>>
  try {
    result = await client().emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    text: `${intro}\n\nCode: ${code}\n\nIt expires in 10 minutes.${notMeUrl ? `\n\nNot a member of this team? Report unauthorized login attempt ('Not Me'): ${notMeUrl}` : " If you didn't request this, ignore this email."}`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:24px">
  <h2 style="margin:0 0 8px">Intopia Hub</h2>
  <p style="color:#475569">${escapeHtml(intro)}</p>
  <p style="font-size:32px;font-weight:700;letter-spacing:8px;font-family:ui-monospace,monospace;margin:24px 0">${escapeHtml(code)}</p>
  <p style="color:#64748b;font-size:13px">It expires in 10 minutes.</p>
  ${
    notMeUrl
      ? `<a href="${escapeHtml(notMeUrl)}" style="display:inline-block;margin-top:16px;padding:12px 16px;border-radius:8px;background:#b91c1c;color:#ffffff;font-weight:600;text-decoration:none">Not a member of this team? Report unauthorized login attempt ('Not Me')</a>`
      : ""
  }
</div>`,
    })
  } catch (thrown) {
    const message = thrown instanceof Error ? thrown.message : String(thrown)
    console.error("[intopia:email] Resend SDK threw:", message)
    throw new Error(`Resend request failed: ${message}`)
  }
  if (result.error) {
    console.error("[intopia:email] Resend returned an error:", JSON.stringify(result.error))
    throw new Error(`Resend: ${result.error.message}`)
  }
  console.log("[intopia:email] sent", { id: result.data?.id, purpose })
}
