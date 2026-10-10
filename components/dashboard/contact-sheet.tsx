"use client"

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react"
import { Copy, Mail, MessageCircle, Send } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { TEAM_BY_ID, teamLabel, whatsappHref, type Listing, type Team } from "@/lib/mock-data"
import { StatusBadge, TypeLabel } from "./listing-badges"

interface Message {
  id: number
  from: "me" | "them"
  text: string
}

const AUTO_REPLIES = [
  "Thanks for reaching out! We can do that — what price range are you thinking?",
  "Great timing. Can you commit before the 8:15 PM offer deadline?",
  "Interested. Let's meet at the trading desk to finalize the contract.",
]

export function ContactSheet({ listing, onOpenChange }: { listing: Listing | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={listing !== null} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        {listing && <ChatPane key={listing.id} listing={listing} />}
      </SheetContent>
    </Sheet>
  )
}

function TeamContactCard({ team }: { team: Team }) {
  async function copy(value: string, what: string) {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${what} copied`, { description: value })
    } catch {
      toast.error(`Couldn't copy ${what.toLowerCase()}`)
    }
  }

  const rows = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      value: team.whatsapp,
      href: whatsappHref(team.whatsapp),
      icon: MessageCircle,
      tone: "text-emerald-400 bg-emerald-500/15",
      external: true,
    },
    {
      key: "email",
      label: "Email",
      value: team.email,
      href: `mailto:${team.email}`,
      icon: Mail,
      tone: "text-primary bg-primary/15",
      external: false,
    },
  ]

  return (
    <section aria-label="Team contact info" className="mt-4 rounded-lg border border-border bg-background/60">
      <p className="border-b border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Team Contact Info · Off-platform
      </p>
      <ul className="divide-y divide-border">
        {rows.map(({ key, label, value, href, icon: Icon, tone, external }) => (
          <li key={key} className="flex items-center gap-3 px-3 py-2">
            <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-md", tone)}>
              <Icon className="size-3.5" aria-hidden />
            </span>
            <a
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="min-w-0 flex-1 leading-tight hover:underline"
            >
              <span className="block text-[11px] text-muted-foreground">{label}</span>
              <span className="block truncate font-mono text-sm">{value}</span>
            </a>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground"
              onClick={() => copy(value, label)}
              aria-label={`Copy ${label}`}
            >
              <Copy className="size-3.5" />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ChatPane({ listing }: { listing: Listing }) {
  const team = TEAM_BY_ID[listing.teamId]
  const label = teamLabel(listing.teamId)
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 0,
      from: "me",
      text: `Hi ${label}, we're interested in your listing for ${listing.product} (${listing.quantity}).`,
    },
    { id: 1, from: "them", text: `Hey! Still available. We're targeting delivery by ${listing.neededBy}. What volume do you need?` },
    { id: 2, from: "me", text: "Full quantity if the price works. Can you share your best unit price?" },
    { id: 3, from: "them", text: "We can do a 4% discount on the full lot if we sign this period." },
  ])
  const [draft, setDraft] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, isTyping])

  useEffect(() => () => {
    if (replyTimer.current) clearTimeout(replyTimer.current)
  }, [])

  function send() {
    const text = draft.trim().slice(0, 500)
    if (!text) return
    setMessages((prev) => [...prev, { id: prev.length, from: "me", text }])
    setDraft("")
    setIsTyping(true)
    toast.success(`Message sent to ${label}`, { description: listing.product })

    if (replyTimer.current) clearTimeout(replyTimer.current)
    replyTimer.current = setTimeout(() => {
      setIsTyping(false)
      setMessages((prev) => [
        ...prev,
        { id: prev.length, from: "them", text: AUTO_REPLIES[prev.length % AUTO_REPLIES.length] },
      ])
    }, 1400)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    send()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter" || e.shiftKey) return
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    e.preventDefault()
    send()
  }

  return (
    <>
      <SheetHeader className="border-b border-border p-5">
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarFallback className="bg-primary/20 font-mono text-sm font-semibold text-primary">{label}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <SheetTitle className="truncate">{team?.name ?? label}</SheetTitle>
            <SheetDescription className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden />
              Online · {team?.region}
            </SheetDescription>
          </div>
        </div>
        {team && <TeamContactCard team={team} />}
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-secondary/40 p-3 text-sm">
          <TypeLabel type={listing.type} />
          <span className="font-medium">{listing.product}</span>
          <span className="font-mono text-xs text-muted-foreground">{listing.quantity}</span>
          <StatusBadge status={listing.status} />
        </div>
      </SheetHeader>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-5" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.from === "me" ? "justify-end" : "justify-start")}>
            <p
              className={cn(
                "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                m.from === "me" ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-secondary",
              )}
            >
              {m.text}
            </p>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <span className="inline-flex gap-1 rounded-2xl rounded-bl-sm bg-secondary px-3.5 py-3" aria-label={`${label} is typing`}>
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-border p-4">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${label}…`}
          aria-label={`Message ${label}`}
          rows={1}
          maxLength={500}
          className="max-h-32 min-h-10 resize-none"
        />
        <Button type="submit" size="icon" disabled={!draft.trim()} aria-label="Send message">
          <Send className="size-4" />
        </Button>
      </form>
    </>
  )
}
