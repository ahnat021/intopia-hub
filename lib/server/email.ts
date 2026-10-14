import "server-only"
import { Resend } from "resend"
import type { OtpPurpose } from "./security"

let resend: Resend | null = null
const client = () => (resend ??= new Resend(process.env.RESEND_API_KEY))

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

const FROM_ADDRESS = "Intopia Hub <noreply@intopiahub.com>"

export const ADMIN_NOTIFY_EMAIL = "ahnat021@uottawa.ca"

export interface KycNotice {
  teamName: string
  company: string
  region: string
  email: string
  whatsapp: string
  hubUrl: string
}

export async function sendAdminKycNotice(notice: KycNotice) {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set in this environment")
  const rows: [string, string][] = [
    ["Team", notice.teamName],
    ["Company", notice.company],
    ["Region", notice.region],
    ["Team email", notice.email],
    ["WhatsApp", notice.whatsapp],
  ]
  const result = await client().emails.send({
    from: FROM_ADDRESS,
    to: ADMIN_NOTIFY_EMAIL,
    subject: `KYC review needed: ${notice.teamName} (${notice.company})`,
    text: `${notice.teamName} verified their email and is waiting for KYC approval.\n\n${rows
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n")}\n\nReview it in the admin console: ${notice.hubUrl}`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:24px">
  <h2 style="margin:0 0 8px">KYC review needed</h2>
  <p style="color:#475569">${escapeHtml(notice.teamName)} verified their email and is waiting for your approval.</p>
  <table style="border-collapse:collapse;margin:16px 0;font-size:14px">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 16px 4px 0;color:#64748b">${escapeHtml(k)}</td><td style="padding:4px 0;font-weight:600">${escapeHtml(v)}</td></tr>`,
    )
    .join("")}</table>
  <a href="${escapeHtml(notice.hubUrl)}" style="display:inline-block;padding:12px 16px;border-radius:8px;background:#1e3a5f;color:#ffffff;font-weight:600;text-decoration:none">Open the admin console</a>
</div>`,
  })
  if (result.error) throw new Error(`Resend: ${result.error.message}`)
  console.log("[intopia:email] admin KYC notice sent", { id: result.data?.id })
}

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
