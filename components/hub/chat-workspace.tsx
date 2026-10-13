"use client"

import { useRef, useState } from "react"
import useSWR from "swr"
import { FileText, Paperclip, Send, Star, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { rateCounterparty } from "@/lib/actions/clearinghouse-actions"
import { ATTACHMENT_ACCEPT, MAX_ATTACHMENT_BYTES } from "@/lib/constants"
import type { Team } from "@/lib/domain"
import { VisibilityPill } from "./visibility-pill"

type Msg = { id: string; fromTeam: string; body: string; createdAt: number; attachmentName?: string; attachmentSize?: number; attachmentMime?: string; attachmentUrl?: string | null }

const fetcher = async (url: string) => {
  const r = await fetch(url)
  const j = await r.json()
  if (!r.ok) throw new Error(j.error ?? "Request failed")
  return j
}
const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`)

export function ChatWorkspace({ viewerId, teams, partnerId, onPartnerChange }: { viewerId: string; teams: Team[]; partnerId: string | null; onPartnerChange: (id: string) => void }) {
  const others = teams.filter((t) => t.id !== viewerId).sort((a, b) => a.number - b.number)
  const { data: thread, mutate, error } = useSWR<{ messages: Msg[] }>(partnerId ? `/api/chat?with=${partnerId}` : null, fetcher, { refreshInterval: 4000 })
  const [body, setBody] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)
  const [stars, setStars] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const partner = others.find((t) => t.id === partnerId)

  const pick = (f: File | undefined) => {
    if (!f) return
    if (f.size > MAX_ATTACHMENT_BYTES) {
      toast.error("Files are limited to 2 MB.")
      if (fileRef.current) fileRef.current.value = ""
      return
    }
    setFile(f)
  }

  const send = async () => {
    if (!partnerId || (!body.trim() && !file)) return
    setSending(true)
    const fd = new FormData()
    fd.set("to", partnerId)
    fd.set("body", body)
    if (file) fd.set("file", file)
    const r = await fetch("/api/chat", { method: "POST", body: fd })
    const j = await r.json().catch(() => ({}))
    setSending(false)
    if (!r.ok) return toast.error(j.error ?? "Message not sent.")
    setBody("")
    setFile(null)
    if (fileRef.current) fileRef.current.value = ""
    void mutate()
  }

  const rate = async (n: number) => {
    if (!partnerId) return
    setStars(n)
    const res = await rateCounterparty(partnerId, n, "", "inquiry")
    res.ok ? toast.success(`Rated ${partner?.name} ${n}★`) : toast.error(res.error)
  }

  return (
    <section aria-labelledby="chat-title" className="flex flex-col gap-4">
      <h2 id="chat-title" className="font-serif text-2xl">
        Negotiations & Live Chat
      </h2>
      <VisibilityPill scope="private" />
      <div className="glass-card flex min-h-[520px] flex-col rounded-lg border border-border">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
          <Select value={partnerId ?? ""} onValueChange={onPartnerChange}>
            <SelectTrigger className="w-64" aria-label="Choose a team to message">
              <SelectValue placeholder="Choose a team to message" />
            </SelectTrigger>
            <SelectContent>
              {others.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  Team {String(t.number).padStart(2, "0")} · {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {partner && (
            <div className="flex items-center gap-1" role="group" aria-label={`Rate ${partner.name}`}>
              <span className="mr-1 text-xs text-muted-foreground">Rate early:</span>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => rate(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`} className="rounded p-0.5 hover:bg-muted">
                  <Star className={`size-4 ${n <= stars ? "fill-gold text-gold" : "text-muted-foreground"}`} aria-hidden />
                </button>
              ))}
            </div>
          )}
        </header>

        <ol className="flex flex-1 flex-col gap-3 overflow-y-auto p-4" aria-live="polite">
          {!partnerId && <li className="m-auto text-sm text-muted-foreground">Pick a team to start a conversation — no contract offer needed.</li>}
          {error && <li className="m-auto text-sm text-destructive">{error.message}</li>}
          {thread?.messages.map((m) => {
            const mine = m.fromTeam === viewerId
            return (
              <li key={m.id} className={`flex max-w-[80%] flex-col gap-2 rounded-lg px-3 py-2 text-sm ${mine ? "self-end bg-primary text-primary-foreground" : "self-start bg-muted"}`}>
                {m.body && <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>}
                {m.attachmentUrl &&
                  (m.attachmentMime?.startsWith("image/") ? (
                    <a href={m.attachmentUrl} target="_blank" rel="noopener noreferrer">
                      <img src={m.attachmentUrl || "/placeholder.svg"} alt={m.attachmentName ?? "Attachment"} className="max-h-56 rounded-md" />
                    </a>
                  ) : (
                    <a href={m.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-md border border-current/20 p-2 underline-offset-2 hover:underline">
                      <FileText className="size-4" aria-hidden />
                      <span className="truncate">{m.attachmentName}</span>
                      <span className="opacity-70">{kb(m.attachmentSize ?? 0)}</span>
                    </a>
                  ))}
                <time className="text-[11px] opacity-70">{new Date(m.createdAt).toLocaleString("en-CA")}</time>
              </li>
            )
          })}
        </ol>

        <form
          className="flex flex-col gap-2 border-t border-border p-3"
          onSubmit={(e) => {
            e.preventDefault()
            void send()
          }}
        >
          {file && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Paperclip className="size-3" aria-hidden /> {file.name} · {kb(file.size)}
              <button type="button" aria-label="Remove attachment" onClick={() => setFile(null)}>
                <X className="size-3" aria-hidden />
              </button>
            </p>
          )}
          <div className="flex items-end gap-2">
            <input ref={fileRef} type="file" accept={ATTACHMENT_ACCEPT} className="sr-only" id="chat-file" onChange={(e) => pick(e.target.files?.[0])} />
            <Button type="button" variant="outline" size="icon" aria-label="Attach file (PDF, Word, JPEG, PNG — max 2 MB)" disabled={!partnerId} onClick={() => fileRef.current?.click()}>
              <Paperclip aria-hidden />
            </Button>
            <Textarea
              aria-label="Message"
              rows={2}
              value={body}
              disabled={!partnerId}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                  e.preventDefault()
                  void send()
                }
              }}
              placeholder={partner ? `Message ${partner.name}…` : "Choose a team first"}
            />
            <Button type="submit" size="icon" aria-label="Send message" disabled={!partnerId || sending || (!body.trim() && !file)}>
              <Send aria-hidden />
            </Button>
          </div>
        </form>
      </div>
    </section>
  )
}
