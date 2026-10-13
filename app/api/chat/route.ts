import { NextResponse, type NextRequest } from "next/server"
import { db } from "@/lib/supabaseClient"
import { getSession } from "@/lib/server/session"
import { newId } from "@/lib/server/security"
import { ATTACHMENT_MIME, CHAT_BUCKET, MAX_ATTACHMENT_BYTES } from "@/lib/constants"

const ID = /^[\w-]{1,60}$/

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
    const { data } = await d.from("chat_messages").select("fromTeam,toTeam,createdAt").or(`fromTeam.eq.${me},toTeam.eq.${me}`).order("createdAt", { ascending: false }).limit(500)
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
  if (error) return NextResponse.json({ error: "Chat isn't set up yet — run migration 002." }, { status: 500 })
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
    const mime = ATTACHMENT_MIME[ext]
    if (!mime) return NextResponse.json({ error: "Only PDF, Word, JPEG or PNG files are allowed." }, { status: 415 })
    const path = `${me}/${row.id}.${ext}`
    const { error } = await db().storage.from(CHAT_BUCKET).upload(path, await file.arrayBuffer(), { contentType: mime, upsert: false })
    if (error) return NextResponse.json({ error: "Upload failed. Is the chat-attachments bucket created?" }, { status: 500 })
    Object.assign(row, { attachmentPath: path, attachmentName: file.name.slice(0, 120), attachmentSize: file.size, attachmentMime: mime })
  }
  const { error } = await db().from("chat_messages").insert(row)
  if (error) return NextResponse.json({ error: "Message not sent." }, { status: 500 })
  return NextResponse.json({ ok: true })
}
