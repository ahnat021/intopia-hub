import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/supabaseClient"
import { getSession } from "@/lib/server/session"
import { newId } from "@/lib/server/security"
import { CHAT_BUCKET, MAX_ATTACHMENT_BYTES, attachmentMime } from "@/lib/constants"

const ID = /^[\w-]{1,60}$/

type DbError = { code?: string; message?: string; details?: string | null; hint?: string | null }

function chatError(stage: string, error: DbError) {
  console.error(`[intopia:chat] ${stage} failed`, error)
  const code = error.code ?? ""
  const fix =
    code === "PGRST205" || code === "PGRST204" || code === "42P01"
      ? "Supabase's API cache hasn't picked up chat_messages yet. In the SQL Editor run: notify pgrst, 'reload schema';"
      : code === "42501"
        ? "The API role can't access chat_messages. In the SQL Editor run: grant all on public.chat_messages to service_role, authenticated, anon;"
        : code === "42703" || code === "PGRST100"
          ? "chat_messages columns don't match (expected id, fromTeam, toTeam, body, createdAt, attachment*)."
          : code === "23503"
            ? "One of the teams in this conversation no longer exists."
            : ""
  const detail = [error.message, code && `(${code})`].filter(Boolean).join(" ")
  return NextResponse.json({ error: fix ? `${fix} — ${detail}` : `Chat error: ${detail || "unknown"}` }, { status: 500 })
}

async function teamId() {
  const s = await getSession()
  return s?.role === "team" ? s.teamId : null
}

export async function GET(req: NextRequest) {
  const me = await teamId()
  if (!me) return NextResponse.json({ error: "Sign in as a team." }, { status: 401 })
  const other = req.nextUrl.searchParams.get("with")
  const d = db()
  if (!other) {
    const { data, error } = await d.from("chat_messages").select("fromTeam,toTeam,createdAt").or(`fromTeam.eq.${me},toTeam.eq.${me}`).order("createdAt", { ascending: false }).limit(500)
    if (error) return chatError("list partners", error)
    const partners = [...new Set((data ?? []).map((m) => (m.fromTeam === me ? m.toTeam : m.fromTeam)))]
    return NextResponse.json({ partners })
  }
  if (!ID.test(other)) return NextResponse.json({ error: "Invalid team." }, { status: 400 })
  const { data, error } = await d
    .from("chat_messages")
    .select("*")
    .or(`and(fromTeam.eq.${me},toTeam.eq.${other}),and(fromTeam.eq.${other},toTeam.eq.${me})`)
    .order("createdAt", { ascending: true })
    .limit(300)
  if (error) return chatError("load thread", error)
  const messages = await Promise.all(
    (data ?? []).map(async (m) => {
      if (!m.attachmentPath) return m
      const { data: signed } = await d.storage.from(CHAT_BUCKET).createSignedUrl(m.attachmentPath, 3600)
      return { ...m, attachmentUrl: signed?.signedUrl ?? null }
    }),
  )
  return NextResponse.json({ messages })
}

export async function POST(req: NextRequest) {
  const me = await teamId()
  if (!me) return NextResponse.json({ error: "Sign in as a team." }, { status: 401 })
  const len = Number(req.headers.get("content-length") ?? 0)
  if (len > MAX_ATTACHMENT_BYTES + 64_000) return NextResponse.json({ error: "Files are limited to 2 MB." }, { status: 413 })
  const form = await req.formData()
  const to = String(form.get("to") ?? "")
  const body = String(form.get("body") ?? "").trim().slice(0, 4000)
  const file = form.get("file")
  if (!ID.test(to) || to === me) return NextResponse.json({ error: "Choose another team to message." }, { status: 400 })
  if (!body && !(file instanceof File)) return NextResponse.json({ error: "Write a message or attach a file." }, { status: 400 })

  const row: Record<string, unknown> = { id: newId("CM"), fromTeam: me, toTeam: to, body, createdAt: Date.now() }
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_ATTACHMENT_BYTES) return NextResponse.json({ error: "Files are limited to 2 MB." }, { status: 413 })
    const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
    const mime = attachmentMime(file.name, file.type)
    if (!mime) return NextResponse.json({ error: "Only PDF, Word, JPEG or PNG files are allowed." }, { status: 415 })
    const path = `${me}/${row.id}.${ext}`
    const { error } = await db().storage.from(CHAT_BUCKET).upload(path, await file.arrayBuffer(), { contentType: mime, upsert: false })
    if (error) {
      console.error("[intopia:chat] upload failed", error)
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 })
    }
    Object.assign(row, { attachmentPath: path, attachmentName: file.name.slice(0, 120), attachmentSize: file.size, attachmentMime: mime })
  }
  const { error } = await db().from("chat_messages").insert(row)
  if (error) return chatError("send message", error)
  return NextResponse.json({ ok: true })
}
