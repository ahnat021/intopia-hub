import "server-only"
import { Resend } from "resend"
import type { OtpPurpose } from "./security"

let resend: Resend | null = null
const client = () => (resend ??= new Resend(process.env.RESEND_API_KEY))

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

export async function sendVerificationCode(to: string, code: string, purpose: OtpPurpose) {
  if (!process.env.RESEND_API_KEY) throw new Error("Email delivery is not configured")
  const subject = purpose === "admin-setup" ? "Your Intopia Hub admin setup code" : "Your Intopia Hub verification code"
  const intro =
    purpose === "admin-setup"
      ? "Use this code to finish setting up the Intopia Hub administrator account."
      : "Use this code to verify your team's email and submit your registration for review."
  const { error } = await client().emails.send({
    from: process.env.RESEND_FROM_EMAIL || "Intopia Hub <onboarding@resend.dev>",
    to,
    subject,
    text: `${intro}\n\nCode: ${code}\n\nIt expires in 10 minutes. If you didn't request this, ignore this email.`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:24px">
  <h2 style="margin:0 0 8px">Intopia Hub</h2>
  <p style="color:#475569">${escapeHtml(intro)}</p>
  <p style="font-size:32px;font-weight:700;letter-spacing:8px;font-family:ui-monospace,monospace;margin:24px 0">${escapeHtml(code)}</p>
  <p style="color:#64748b;font-size:13px">It expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
</div>`,
  })
  if (error) throw new Error(error.message)
}
