"use client"

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { Copy, FileSignature, Inbox, Mail, MessageCircle, Send } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useHub } from "@/lib/hub-store"
import { PRODUCT_INFO, formatUnits } from "@/lib/intopia-rules"
import { TEAM_BY_ID, formatSimClock, teamLabel, whatsappHref, type Listing, type Team } from "@/lib/mock-data"
import { DeliveryLabel, StatusBadge, TypeLabel } from "../listing-badges"
import { ContractCard } from "./contract-card"
import { ContractForm } from "./contract-form"

function copy(value: string, label: string) {
  navigator.clipboard?.writeText(value).then(
    () => toast.success(`${label} copied`),
    () => toast.error(`Couldn't copy ${label.toLowerCase()}`),
  )
}

function ContactCard({ team }: { team: Team }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 p-2">
        <MessageCircle className="size-4 shrink-0 text-emerald-400" aria-hidden />
        <a href={whatsappHref(team.whatsapp)} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-mono text-xs hover:underline">
          {team.whatsapp}
        </a>
        <Button variant="ghost" size="icon-xs" onClick={() => copy(team.whatsapp, "WhatsApp number")} aria-label={`Copy ${team.name} WhatsApp number`}>
          <Copy aria-hidden />
        </Button>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 p-2">
        <Mail className="size-4 shrink-0 text-sky-400" aria-hidden />
        <a href={`mailto:${team.email}`} className="min-w-0 flex-1 truncate font-mono text-xs hover:underline">{team.email}</a>
        <Button variant="ghost" size="icon-xs" onClick={() => copy(team.email, "Email")} aria-label={`Copy ${team.name} email`}>
          <Copy aria-hidden />
        </Button>
      </div>
    </div>
  )
}

interface Props {
  listing: Listing | null
  threadId: string | null
  viewer: Team
  onSelectThread: (threadId: string) => void
  onClose: () => void
}

export function NegotiationSheet({ listing, threadId, viewer, onSelectThread, onClose }: Props) {
  const { threads, messages, contracts, lockedOut, sendMessage, draftContract, finalizeContract } = useHub()
  const [draft, setDraft] = useState("")
  const [drafting, setDrafting] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const listingThreads = useMemo(
    () => (listing ? Object.values(threads).filter((t) => t.listingId === listing.id && t.teamIds.includes(viewer.id)).sort((a, b) => b.updatedAt - a.updatedAt) : []),
    [threads, listing, viewer.id],
  )
  const thread = threadId ? threads[threadId] : undefined
  const counterparty = thread ? TEAM_BY_ID[thread.teamIds.find((t) => t !== viewer.id) ?? ""] : undefined
  const threadMessages = useMemo(() => messages.filter((m) => m.threadId === threadId), [messages, threadId])
  const threadContracts = useMemo(() => contracts.filter((c) => c.threadId === threadId), [contracts, threadId])
  const hasLiveContract = threadContracts.some((c) => c.status === "AWAITING" || c.status === "FINALIZED")

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" })
  }, [threadMessages.length, threadContracts])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text || !threadId) return
    sendMessage(threadId, viewer.id, text)
    setDraft("")
  }

  return (
    <Sheet open={!!listing} onOpenChange={(o) => { if (!o) { setDrafting(false); onClose() } }}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        {listing && (
          <>
            <SheetHeader className="gap-3 border-b border-border p-5 pr-12">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={listing.status} />
                <TypeLabel type={listing.type} />
                <span className="font-mono text-[11px] text-muted-foreground">{listing.id}</span>
              </div>
              <SheetTitle className="text-lg">{listing.title}</SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{PRODUCT_INFO[listing.product].kind}</span>
                {listing.quantity && <span className="font-mono">{formatUnits(listing.quantity)} units</span>}
                {listing.unitPrice && <span className="font-mono">${listing.unitPrice}/unit</span>}
                <span>{listing.region}</span>
                <DeliveryLabel mode={listing.delivery} />
              </SheetDescription>

              {listingThreads.length > 1 && (
                <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Negotiation threads">
                  {listingThreads.map((t) => {
                    const other = t.teamIds.find((id) => id !== viewer.id)!
                    return (
                      <button
                        key={t.id}
                        role="tab"
                        aria-selected={t.id === threadId}
                        onClick={() => onSelectThread(t.id)}
                        className={cn("rounded-full px-2.5 py-1 text-xs font-medium ring-1", t.id === threadId ? "bg-primary/20 text-foreground ring-primary/50" : "text-muted-foreground ring-border hover:text-foreground")}
                      >
                        {teamLabel(other)}
                      </button>
                    )
                  })}
                </div>
              )}

              {counterparty && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-muted-foreground">
                    Negotiating with <span className="font-semibold text-foreground">{counterparty.name}</span> · {counterparty.company} · {counterparty.region}
                  </p>
                  <ContactCard team={counterparty} />
                </div>
              )}
            </SheetHeader>

            {!thread || !counterparty ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
                <Inbox className="size-8" aria-hidden />
                <p className="text-sm">No teams have opened a negotiation on this listing yet.</p>
              </div>
            ) : (
              <>
                <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5" aria-live="polite">
                  {threadMessages.map((m) => {
                    if (m.from === "system")
                      return <p key={m.id} className="mx-auto rounded-full bg-emerald-500/10 px-3 py-1 text-center text-xs text-emerald-300">{m.text}</p>
                    const mine = m.from === viewer.id
                    const contract = m.contractId ? threadContracts.find((c) => c.id === m.contractId) : undefined
                    return (
                      <div key={m.id} className={cn("flex max-w-[88%] flex-col gap-1", mine ? "self-end items-end" : "self-start items-start")}>
                        <span className="text-[11px] text-muted-foreground">{teamLabel(m.from)} · {formatSimClock(m.at)}</span>
                        {contract ? (
                          <div className="w-80 max-w-full">
                            <ContractCard contract={contract} viewerId={viewer.id} locked={lockedOut} onFinalize={(id) => finalizeContract(id, viewer.id)} />
                          </div>
                        ) : (
                          <p className={cn("rounded-2xl px-3.5 py-2 text-sm leading-relaxed", mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-secondary")}>
                            {m.text}
                          </p>
                        )}
                      </div>
                    )
                  })}
                  {drafting && (
                    <ContractForm
                      listing={listing}
                      threadId={thread.id}
                      viewer={viewer}
                      counterparty={counterparty}
                      locked={lockedOut}
                      onCancel={() => setDrafting(false)}
                      onSubmit={(d) => {
                        draftContract(d)
                        setDrafting(false)
                        toast.success("Contract sent for signature", { description: `Waiting on ${counterparty.name}` })
                      }}
                    />
                  )}
                  <div ref={endRef} />
                </div>

                <div className="flex flex-col gap-2 border-t border-border p-4">
                  {!drafting && (
                    <Button
                      variant="outline"
                      className="w-full border-primary/40"
                      onClick={() => setDrafting(true)}
                      disabled={lockedOut || hasLiveContract}
                    >
                      <FileSignature aria-hidden />
                      {lockedOut ? "Contracts locked for processing" : hasLiveContract ? "Contract already on file" : "Draft Formal Trade Contract"}
                    </Button>
                  )}
                  <form onSubmit={submit} className="flex gap-2">
                    <Input
                      aria-label={`Message ${counterparty.name}`}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault()
                      }}
                      placeholder={`Message ${counterparty.name}…`}
                    />
                    <Button type="submit" size="icon" disabled={!draft.trim()} aria-label="Send message">
                      <Send aria-hidden />
                    </Button>
                  </form>
                </div>
              </>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
