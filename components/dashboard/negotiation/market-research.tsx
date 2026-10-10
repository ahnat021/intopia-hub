"use client"

import { useState, type FormEvent } from "react"
import { CheckCircle2, Microscope, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { OPERATING_AREAS, formatCompactUSD, type Region } from "@/lib/intopia-rules"
import { MR_ITEMS, teamLabel, type MrOffer, type Team } from "@/lib/mock-data"
import type { MrOfferDraft } from "@/lib/hub-store"

interface FormProps {
  threadId: string
  viewer: Team
  counterparty: Team
  onSubmit: (draft: MrOfferDraft) => void
  onCancel: () => void
}

export function MarketResearchForm({ threadId, viewer, counterparty, onSubmit, onCancel }: FormProps) {
  const [itemId, setItemId] = useState(String(MR_ITEMS[0].id))
  const [area, setArea] = useState<Region>(counterparty.region)
  const [price, setPrice] = useState("40")
  const [ack, setAck] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const priceK = Number(price)
  const priceError = !(Number.isFinite(priceK) && priceK >= 1 && priceK <= 500) ? "Service fee must be between $1K and $500K." : null
  const ackError = !ack ? "Acknowledge how MR sharing is settled in the simulation." : null
  const item = MR_ITEMS.find((i) => String(i.id) === itemId)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (priceError || ackError) return
    onSubmit({ threadId, sellerId: viewer.id, buyerId: counterparty.id, itemId: Number(itemId), area, priceK })
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4 rounded-xl border border-sky-500/30 bg-sky-500/5 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Microscope className="size-4 text-sky-400" aria-hidden />
          Share market research
        </h3>
        <span className="font-mono text-[11px] text-muted-foreground">{viewer.name} → {counterparty.name}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 flex flex-col gap-1.5">
          <Label className="text-xs">MR item</Label>
          <Select value={itemId} onValueChange={setItemId}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MR_ITEMS.map((i) => <SelectItem key={i.id} value={String(i.id)}>{i.label} · {i.description}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Area covered</Label>
          <Select value={area} onValueChange={(v) => setArea(v as Region)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {OPERATING_AREAS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mr-price" className="text-xs">Service payment ($K)</Label>
          <Input id="mr-price" type="number" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
          {submitted && priceError && <p role="alert" className="text-xs text-destructive">{priceError}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-start gap-2.5 rounded-lg bg-background/50 p-3">
          <Checkbox id="mr-ack" checked={ack} onCheckedChange={(v) => setAck(v === true)} className="mt-0.5" />
          <Label htmlFor="mr-ack" className="text-xs leading-relaxed font-normal text-muted-foreground">
            {`I confirm ${item?.label ?? "this MR item"} was purchased by our team in the simulation, and that payment is settled as a cash service payment entered on each team's Intopia decision form. The hub only records the agreement.`}
          </Label>
        </div>
        {submitted && ackError && <p role="alert" className="text-xs text-destructive">{ackError}</p>}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <p className="font-mono text-lg font-bold tabular-nums">{formatCompactUSD((Number.isFinite(priceK) ? priceK : 0) * 1000)}</p>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          <Button type="submit" size="sm">
            <Microscope aria-hidden />
            Send MR offer
          </Button>
        </div>
      </div>
    </form>
  )
}

const MR_STATUS = {
  OFFERED: { label: "Offer pending", className: "bg-amber-500/15 text-amber-300 ring-amber-500/30" },
  ACCEPTED: { label: "Accepted · settle by service payment", className: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30" },
  DECLINED: { label: "Declined", className: "bg-destructive/15 text-destructive ring-destructive/30" },
} as const

export function MarketResearchCard({
  offer,
  viewerId,
  closed,
  onRespond,
}: {
  offer: MrOffer
  viewerId: string
  closed: boolean
  onRespond: (accept: boolean) => void
}) {
  const item = MR_ITEMS.find((i) => i.id === offer.itemId)
  const canRespond = offer.status === "OFFERED" && offer.buyerId === viewerId && !closed
  const meta = MR_STATUS[offer.status]

  return (
    <article aria-label={`Market research offer ${offer.id}`} className="overflow-hidden rounded-xl border border-sky-500/30 bg-gradient-to-b from-secondary/80 to-card">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest">
          <Microscope className="size-3.5 text-sky-400" aria-hidden />
          Market Research
        </p>
        <span className="font-mono text-[11px] text-muted-foreground">{offer.id}</span>
      </div>
      <div className="flex flex-col gap-3 px-4 py-3">
        <span className={cn("inline-flex w-fit rounded-md px-2 py-1 text-[11px] font-semibold ring-1 ring-inset", meta.className)}>{meta.label}</span>
        <div>
          <p className="text-sm font-semibold">{item?.label} · {offer.area}</p>
          <p className="text-xs text-muted-foreground">{item?.description}</p>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
          <dt className="text-muted-foreground">Shared by</dt>
          <dd className="text-right font-medium">{teamLabel(offer.sellerId)}</dd>
          <dt className="text-muted-foreground">Recipient</dt>
          <dd className="text-right font-medium">{teamLabel(offer.buyerId)}</dd>
          <dt className="text-muted-foreground">Service payment</dt>
          <dd className="text-right font-mono font-bold">{formatCompactUSD(offer.priceK * 1000)}</dd>
        </dl>
        {canRespond && (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => onRespond(false)}>
              <XCircle aria-hidden />
              Decline
            </Button>
            <Button onClick={() => onRespond(true)}>
              <CheckCircle2 aria-hidden />
              Accept offer
            </Button>
          </div>
        )}
      </div>
    </article>
  )
}
