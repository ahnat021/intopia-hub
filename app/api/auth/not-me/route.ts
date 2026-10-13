import { isSupabaseConfigured } from "@/lib/supabaseClient"
import { reportIntrusion, verifyNotMeToken } from "@/lib/server/security"

const page = (title: string, body: string, status = 200) =>
  new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="font-family:system-ui,sans-serif;background:#070B14;color:#F8FAFC;display:grid;place-items:center;min-height:100vh;margin:0">
<main style="max-width:440px;padding:32px;border:1px solid #1E293B;border-radius:16px;background:#0F172A"><h1 style="margin:0 0 8px;font-size:20px">${title}</h1><p style="color:#94A3B8;line-height:1.6">${body}</p></main></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  )

export async function GET(request: Request) {
  const url = new URL(request.url)
  const teamId = (url.searchParams.get("team") ?? "").slice(0, 8)
  const token = url.searchParams.get("token") ?? ""
  if (!isSupabaseConfigured() || !teamId || !verifyNotMeToken(teamId, token))
    return page("Link expired", "This security link is invalid or has expired. If you suspect misuse, contact the hub administrator.", 400)
  await reportIntrusion(teamId)
  return page(
    "Unauthorized attempt reported",
    "Thank you. The pending code has been invalidated, logins for this team are locked for 10 minutes, and the hub administrator has been alerted.",
  )
}
