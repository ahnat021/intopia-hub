"use client"

import { useState, type FormEvent } from "react"
import { Info, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  DELIVERY_INFO,
  GRADES,
  HOME_OFFICE,
  OPERATING_AREAS,
  PRICE_BOUNDS,
  PRODUCTS,
  PRODUCT_INFO,
  averageCost,
  priceError,
  quantityError,
  type DeliveryMode,
  type ListingRegion,
  type Product,
} from "@/lib/intopia-rules"
import type { ListingType } from "@/lib/mock-data"
import type { NewListingInput } from "@/lib/hub-store"

const TYPE_OPTIONS: { value: ListingType; label: string }[] = [
  { value: "BUY", label: "Buy request" },
  { value: "SELL", label: "Sell offer" },
  { value: "PARTNERSHIP", label: "Partnership / JV" },
  { value: "RND", label: "R&D / Patent license" },
]

function FieldError({ children }: { children?: string | null }) {
  if (!children) return null
  return <p role="alert" className="text-xs text-destructive">{children}</p>
}

export function PostListingDialog({ teamId, locked, onPost }: { teamId: string; locked: boolean; onPost: (input: NewListingInput) => void }) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<ListingType>("SELL")
  const [product, setProduct] = useState<Product>("X")
  const [grade, setGrade] = useState(0)
  const [quantity, setQuantity] = useState("")
  const [price, setPrice] = useState("")
  const [region, setRegion] = useState<ListingRegion>("North America")
  const [delivery, setDelivery] = useState<DeliveryMode>("SURFACE")
  const [title, setTitle] = useState("")
  const [notes, setNotes] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const isTrade = type === "BUY" || type === "SELL"
  const homeOfficeAllowed = type === "RND"

  const errors = {
    quantity: isTrade ? quantityError(Number(quantity)) : null,
    price: isTrade ? priceError(product, grade, Number(price), type === "SELL") : null,
    title: !isTrade && title.trim().length < 4 ? "Give the opportunity a short title." : null,
    region: region === "Home Office" && !homeOfficeAllowed ? `The Home Office (${HOME_OFFICE.country}) handles ${HOME_OFFICE.allowed} — no manufacturing or sales.` : null,
    notes: notes.trim().length > 140 ? "Keep notes under 140 characters." : null,
  }

  const reset = () => {
    setQuantity(""); setPrice(""); setTitle(""); setNotes(""); setSubmitted(false)
  }

  const changeType = (v: ListingType) => {
    setType(v)
    if (v !== "RND" && region === "Home Office") setRegion("North America")
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (Object.values(errors).some(Boolean)) return
    onPost({
      type,
      teamId,
      product,
      grade,
      title: isTrade ? `Product ${product} · Grade ${grade}` : title.trim(),
      quantity: isTrade ? Number(quantity) : null,
      unitPrice: isTrade ? Number(price) : null,
      region,
      delivery: isTrade ? delivery : null,
      notes: notes.trim() || (isTrade ? DELIVERY_INFO[delivery].eta : "Open to proposals"),
    })
    toast.success("Listing posted to the Live Marketplace")
    reset()
    setOpen(false)
  }

  const err = (key: keyof typeof errors) => (submitted ? errors[key] : null)

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset() }}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={locked} title={locked ? "Contracts are locked for processing" : undefined}>
          <Plus aria-hidden />
          Post a Listing
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Post a listing</DialogTitle>
          <DialogDescription>Listings are validated against the official Period 4 rules.</DialogDescription>
        </DialogHeader>

        <form id="post-listing" onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-2">
              <Label>Listing type</Label>
              <Select value={type} onValueChange={(v) => changeType(v as ListingType)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {!isTrade && (
              <div className="col-span-2 flex flex-col gap-2">
                <Label htmlFor="pl-title">Title</Label>
                <Input id="pl-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={type === "RND" ? "Y6 Patent License" : "China Joint Venture"} />
                <FieldError>{err("title")}</FieldError>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label>Product</Label>
              <Select value={product} onValueChange={(v) => setProduct(v as Product)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRODUCTS.map((p) => <SelectItem key={p} value={p}>{PRODUCT_INFO[p].name} · {PRODUCT_INFO[p].kind.split(" / ")[0]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Grade</Label>
              <Select value={String(grade)} onValueChange={(v) => setGrade(Number(v))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GRADES.map((g) => <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {isTrade && (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="pl-qty">Quantity (thousand units)</Label>
                  <Input id="pl-qty" type="number" inputMode="decimal" min={0.5} step={0.5} value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="7.5" />
                  <FieldError>{err("quantity")}</FieldError>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="pl-price">Unit price ($)</Label>
                  <Input id="pl-price" type="number" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={`${PRICE_BOUNDS[product].min}–${PRICE_BOUNDS[product].max}`} />
                  <FieldError>{err("price")}</FieldError>
                </div>
              </>
            )}

            <div className="flex flex-col gap-2">
              <Label>Region</Label>
              <Select value={region} onValueChange={(v) => setRegion(v as ListingRegion)}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OPERATING_AREAS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  <SelectItem value="Home Office" disabled={!homeOfficeAllowed}>
                    Home Office ({HOME_OFFICE.country}){homeOfficeAllowed ? "" : " — R&D only"}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FieldError>{err("region")}</FieldError>
            </div>
            {isTrade && (
              <div className="flex flex-col gap-2">
                <Label>Delivery</Label>
                <Select value={delivery} onValueChange={(v) => setDelivery(v as DeliveryMode)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["AIR", "SURFACE"] as const).map((d) => <SelectItem key={d} value={d}>{DELIVERY_INFO[d].label} · {DELIVERY_INFO[d].arrives}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="pl-notes">Notes <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Textarea id="pl-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Terms, timing, or anything partners should know" />
              <FieldError>{err("notes")}</FieldError>
            </div>
          </div>

          {isTrade && (
            <p className="flex gap-2 rounded-lg bg-secondary/60 p-3 text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
              <span>
                Avg. cost for {product}{grade} is <span className="font-mono text-foreground">${averageCost(product, grade)}</span>/unit.
                {type === "SELL" ? " Sell prices must exceed it (transfer pricing rule)." : " Sellers cannot accept bids at or below it."}
              </span>
            </p>
          )}
        </form>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" form="post-listing">Post listing</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
