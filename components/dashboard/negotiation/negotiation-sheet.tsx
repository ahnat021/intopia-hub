"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Ban, Copy, FileSignature, Inbox, Lock, Mail, MessageCircle, Microscope, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useHub } from "@/lib/hub-store"
import { PRODUCT_INFO, formatUnits } from "@/lib/intopia-rules"
import { TEAM_BY_ID, formatSimClock, teamLabel, whatsappHref, type Contract, type Listing, type Team } from "@/lib/mock-data"
import { DeliveryLabel, StatusBadge, TypeLabel } from "../listing-badges"
import { ContractCard } from "./contract-card"
import { ContractForm } from "./contract-form"
import { MarketResearchCard, MarketResearchForm } from "./market-research"
import { RatePartnerDialog } from "./rate-partner-dialog"

type Composer = { mode: "trade"; counterOf?: Contract } | { mode: "mr" } | null

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
        <a href={whatsappHref(team.whatsapp)} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-mono text-xs hover:underline">{team.whatsapp}</a>
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
  const { threads, messages, contracts, mrOffers, ratings, lockedOut, draftContract, finalizeContract, rejectAndClose, proposeMr, respondMr } = useHub()
  const [composer, setComposer] = useState<Composer>(null)
  const [confirmReject, setConfirmReject] = useState(false)
  const [ratingFor, setRatingFor] = useState<Contract | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const listingThreads = useMemo(
    () => (listing ? Object.values(threads).filter((t) => t.listingId === listing.id && t.teamIds.includes(viewer.id)).sort((a, b) => b.updatedAt - a.updatedAt) : []),
    [threads, listing, viewer.id],
  )
  const thread = threadId ? threads[threadId] : undefined
  const counterparty = thread ? TEAM_BY_ID[thread.teamIds.find((t) => t !== viewer.id) ?? ""] : undefined
  const closed = !!thread?.closed
  const feed = useMemo(() => messages.filter((m) => m.threadId === threadId), [messages, threadId])
  const threadContracts = useMemo(() => contracts.filter((c) => c.threadId === threadId), [contracts, threadId])
  const hasAwaiting = threadContracts.some((c) => c.status === "AWAITING")
  const hasFinal = threadContracts.some((c) => c.status === "FINALIZED")
  const hasRated = (contractId: string) => ratings.some((r) => r.contractId === contractId && r.fromId === viewer.id)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" })
  }, [feed.length, composer])

  const reset = () => {
    setComposer(null)
    onClose()
  }

  const tradeBlockedReason = lockedOut ? "Contracts locked for processing" : closed ? "Negotiation closed" : hasFinal ? "Contract already finalized" : hasAwaiting ? "Respond to the open proposal first" : null

  return (
    <Sheet open={!!listing} onOpenChange={(o) => !o && reset()}>
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
                        onClick={() => { setComposer(null); onSelectThread(t.id) }}
                        className={cn("rounded-full px-2.5 py-1 text-xs font-medium ring-1", t.id === threadId ? "bg-primary/20 text-foreground ring-primary/50" : "text-muted-foreground ring-border hover:text-foreground")}
                      >
                        {teamLabel(other)}{t.closed ? " · closed" : ""}
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
                <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5" aria-live="polite" aria-label="Structured proposal feed">
                  <p className="mx-auto flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">
                    <ShieldCheck className="size-3.5" aria-hidden />
                    Structured proposal feed · free text disabled
                  </p>
                  {feed.map((m) => {
                    const contract = m.contractId ? threadContracts.find((c) => c.id === m.contractId) : undefined
                    const offer = m.mrOfferId ? mrOffers.find((o) => o.id === m.mrOfferId) : undefined
                    if (m.from === "system" || (!contract && !offer))
                      return (
                        <p key={m.id} className="mx-auto max-w-[90%] rounded-full bg-secondary/70 px-3 py-1 text-center text-xs text-muted-foreground">
                          {m.text} <span className="font-mono opacity-70">{formatSimClock(m.at)}</span>
                        </p>
                      )
                    const mine = m.from === viewer.id
                    return (
                      <div key={m.id} className={cn("flex w-80 max-w-[92%] flex-col gap-1", mine ? "self-end items-end" : "self-start items-start")}>
                        <span className="text-[11px] text-muted-foreground">{teamLabel(m.from)} · {formatSimClock(m.at)}</span>
                        <div className="w-full">
                          {contract && (
                            <ContractCard
                              contract={contract}
                              viewerId={viewer.id}
                              locked={lockedOut}
                              closed={closed}
                              canRate={!hasRated(contract.id) && (contract.initiatorId === viewer.id || contract.counterpartyId === viewer.id)}
                              onFinalize={(id) => {
                                const result = finalizeContract(id, viewer.id)
                                if (result) setTimeout(() => setRatingFor(result), 900)
                                return result
                              }}
                              onCounter={(c) => setComposer({ mode: "trade", counterOf: c })}
                              onRate={setRatingFor}
                            />
                          )}
                          {offer && (
                            <MarketResearchCard
                              offer={offer}
                              viewerId={viewer.id}
                              closed={closed}
                              onRespond={(accept) => {
                                respondMr(offer.id, viewer.id, accept)
                                toast[accept ? "success" : "info"](accept ? "Market research accepted" : "Market research declined")
                              }}
                            />
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {composer?.mode === "trade" && (
                    <ContractForm
                      key={composer.counterOf?.id ?? "new"}
                      listing={listing}
                      threadId={thread.id}
                      viewer={viewer}
                      counterparty={counterparty}
                      locked={lockedOut}
                      initial={composer.counterOf}
                      onCancel={() => setComposer(null)}
                      onSubmit={(d) => {
                        draftContract(d, composer.counterOf?.id)
                        setComposer(null)
                        toast.success(composer.counterOf ? "Counter-offer sent" : "Proposal sent", { description: `Waiting on ${counterparty.name}` })
                      }}
                    />
                  )}
                  {composer?.mode === "mr" && (
                    <MarketResearchForm
                      threadId={thread.id}
                      viewer={viewer}
                      counterparty={counterparty}
                      onCancel={() => setComposer(null)}
                      onSubmit={(d) => {
                        proposeMr(d)
                        setComposer(null)
                        toast.success("Market research offer sent")
                      }}
                    />
                  )}
                  <div ref={endRef} />
                </div>

                <div className="flex flex-col gap-2 border-t border-border p-4" data-tour="action-bar">
                  {closed ? (
                    <p className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
                      <Lock className="size-4" aria-hidden />
                      This negotiation is closed. No further proposals can be sent.
                    </p>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          onClick={() => setComposer({ mode: "trade" })}
                          disabled={!!tradeBlockedReason || composer !== null}
                          title={tradeBlockedReason ?? undefined}
                          className="px-2"
                        >
                          <FileSignature aria-hidden />
                          <span className="truncate">Propose Trade</span>
                        </Button>
                        <Button variant="outline" onClick={() => setComposer({ mode: "mr" })} disabled={lockedOut || composer !== null} className="px-2">
                          <Microscope aria-hidden />
                          <span className="truncate">Share MR</span>
                        </Button>
                        <Button variant="outline" onClick={() => setConfirmReject(true)} disabled={lockedOut || hasFinal} className="px-2 text-destructive hover:text-destructive">
                          <Ban aria-hidden />
                          <span className="truncate">Reject & Close</span>
                        </Button>
                      </div>
                      {tradeBlockedReason && !composer && <p className="text-center text-[11px] text-muted-foreground">{tradeBlockedReason}</p>}
                    </>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </SheetContent>

      <AlertDialog open={confirmReject} onOpenChange={setConfirmReject}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject & close this negotiation?</AlertDialogTitle>
            <AlertDialogDescription>
              Any open proposals or market research offers with {counterparty?.name} will be rejected, and the thread will be locked. The listing reopens to other teams.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep negotiating</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (threadId) rejectAndClose(threadId, viewer.id)
                setComposer(null)
                toast.info("Negotiation closed")
              }}
            >
              Reject & Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RatePartnerDialog contract={ratingFor} viewerId={viewer.id} onClose={() => setRatingFor(null)} />
    </Sheet>
  )
}
