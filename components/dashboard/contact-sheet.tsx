"use client"

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react"
import { Send } from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { TEAM_BY_ID, teamLabel, type Listing } from "@/lib/mock-data"
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

function ChatPane({ listing }: { listing: Listing }) {
  const team = TEAM_BY_ID[listing.teamId]
  const label = teamLabel(listing.teamId)
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 0,
      from: "me",
      text: `Hi ${label}, we're interested in your listing for ${listing.product} (${listing.quantity}).`,
    },
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
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-secondary/40 p-3 text-sm">
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
