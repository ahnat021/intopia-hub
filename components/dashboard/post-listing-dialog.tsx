"use client"

import { useState, type FormEvent } from "react"
import { Factory, Info, Package, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  DELIVERY_INFO,
  FACTORY_RULES,
  GRADES,
  HOME_OFFICE,
  MAX_FACTORIES_PER_AREA,
  OPERATING_AREAS,
  formatUSD,
  PRICE_BOUNDS,
  PRODUCTS,
  PRODUCT_INFO,
  averageCost,
  priceError,
  priceWarning,
  quantityError,
  quantityWarning,
  type DeliveryMode,
  type ListingRegion,
  type Product,
} from "@/lib/intopia-rules"
import { factoryLabel, type ListingAsset, type ListingType } from "@/lib/domain"
import type { NewListingInput } from "@/lib/hub-store"

const TYPE_OPTIONS: { value: ListingType; label: string }[] = [
  { value: "BUY", label: "Buy request" },
  { value: "SELL", label: "Sell offer" },
  { value: "OTHER", label: "Other (MR cost-split, services…)" },
]

function FieldError({ children }: { children?: string | null }) {
  if (!children) return null
  return <p role="alert" className="text-xs text-destructive">{children}</p>
}

function FieldWarning({ children }: { children?: string | null }) {
  if (!children) return null
  return <p role="status" className="text-xs text-warning">{children}</p>
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
  const [confirmedWarnings, setConfirmedWarnings] = useState("")

  const [asset, setAsset] = useState<ListingAsset>("PRODUCT")

  const isTrade = type === "BUY" || type === "SELL"
  const factory = isTrade && asset === "FACTORY"
  const productTrade = isTrade && !factory
  const homeOfficeAllowed = type === "RND"
  const factoryCount = Number(quantity)
  const factoryPriceK = Number(price)

  const errors = {
    quantity: factory
      ? !Number.isInteger(factoryCount) || factoryCount < 1 || factoryCount > MAX_FACTORIES_PER_AREA
        ? `Enter a whole number of factories, 1–${MAX_FACTORIES_PER_AREA} (max ${MAX_FACTORIES_PER_AREA} per area).`
        : null
      : isTrade ? quantityError(Number(quantity)) : null,
    price: factory ? (!(factoryPriceK > 0) ? "Enter a price per factory." : null) : isTrade ? priceError(Number(price)) : null,
    title: !isTrade && title.trim().length < 4 ? "Give the opportunity a short title." : null,
    region: region === "Home Office" && !homeOfficeAllowed ? `The Home Office (${HOME_OFFICE.country}) handles ${HOME_OFFICE.allowed} — no manufacturing or sales.` : null,
    notes: notes.trim().length > 140 ? "Keep notes under 140 characters." : null,
  }

  const warnings = {
    quantity: productTrade ? quantityWarning(Number(quantity)) : null,
    price: productTrade ? priceWarning(product, grade, Number(price), type === "SELL") : null,
  }
  const warningKey = [warnings.quantity, warnings.price].filter(Boolean).join("|")
  const confirming = warningKey !== "" && confirmedWarnings === warningKey

  const reset = () => {
    setQuantity(""); setPrice(""); setTitle(""); setNotes(""); setSubmitted(false); setConfirmedWarnings("")
  }

  const changeType = (v: ListingType) => {
    setType(v)
    if (v !== "RND" && region === "Home Office") setRegion("North America")
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    if (Object.values(errors).some(Boolean)) return
    // Unusual values are allowed, but the poster must see the warning and submit again to confirm.
    if (warningKey && confirmedWarnings !== warningKey) {
      setConfirmedWarnings(warningKey)
      return
    }
    onPost(
      factory
        ? {
            type,
            asset: "FACTORY",
            teamId,
            product,
            grade: 0,
            title: `Product ${product} ${factoryCount === 1 ? "factory" : "factories"}`,
            quantity: factoryCount,
            unitPrice: Math.round(factoryPriceK * 1000),
            region,
            delivery: null,
            notes: notes.trim() || `${factoryLabel(factoryCount)} in ${region}`,
          }
        : {
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
          },
    )
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
          <DialogDescription>Unusual prices or quantities get a warning, but you can still post them.</DialogDescription>
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

            {isTrade && (
              <fieldset className="col-span-2 flex flex-col gap-2">
                <legend className="mb-2 text-sm font-medium">What are you trading?</legend>
                <div className="grid grid-cols-2 gap-2" role="radiogroup">
                  {([
                    ["PRODUCT", "Products", "Lots of finished units", Package],
                    ["FACTORY", "Factories", "Whole X or Y plants", Factory],
                  ] as const).map(([value, label, hint, Icon]) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={asset === value}
                      onClick={() => { setAsset(value); setQuantity(""); setPrice(""); setConfirmedWarnings("") }}
                      className={cn(
                        "flex items-start gap-2.5 rounded-lg border p-3 text-left transition-colors",
                        asset === value ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/60",
                      )}
                    >
                      <Icon className={cn("mt-0.5 size-4 shrink-0", asset === value ? "text-primary" : "text-muted-foreground")} aria-hidden />
                      <span className="flex flex-col">
                        <span className="text-sm font-medium">{label}</span>
                        <span className="text-xs text-muted-foreground">{hint}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

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
            {!factory && (
              <div className="flex flex-col gap-2">
                <Label>Grade</Label>
                <Select value={String(grade)} onValueChange={(v) => setGrade(Number(v))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GRADES.map((g) => <SelectItem key={g} value={String(g)}>Grade {g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {factory && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="pl-factories">Number of factories</Label>
                <Input id="pl-factories" type="number" inputMode="numeric" min={1} max={MAX_FACTORIES_PER_AREA} step={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="1" />
                <FieldError>{err("quantity")}</FieldError>
              </div>
            )}
            {factory && (
              <div className="col-span-2 flex flex-col gap-2">
                <Label htmlFor="pl-factory-price">Price per factory ($K)</Label>
                <Input id="pl-factory-price" type="number" inputMode="decimal" min={1} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1500" />
                <FieldError>{err("price")}</FieldError>
                {factoryCount > 0 && factoryPriceK > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Total <span className="font-mono text-foreground">{formatUSD(factoryCount * factoryPriceK * 1000)}</span> for {factoryLabel(factoryCount)}
                  </p>
                )}
              </div>
            )}

            {productTrade && (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="pl-qty">Quantity (thousand units)</Label>
                  <Input id="pl-qty" type="number" inputMode="decimal" min={0.5} step={0.5} value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="7.5" />
                  <FieldError>{err("quantity")}</FieldError>
                  <FieldWarning>{warnings.quantity}</FieldWarning>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="pl-price">Unit price ($)</Label>
                  <Input id="pl-price" type="number" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={`${PRICE_BOUNDS[product].min}–${PRICE_BOUNDS[product].max}`} />
                  <FieldError>{err("price")}</FieldError>
                  <FieldWarning>{warnings.price}</FieldWarning>
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
            {productTrade && (
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

          {factory && (
            <p className="flex gap-2 rounded-lg bg-secondary/60 p-3 text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
              <span>
                A team can run at most {MAX_FACTORIES_PER_AREA} factories per area. A new {product} factory takes {FACTORY_RULES[product].build} to build ({FACTORY_RULES[product].note.toLowerCase()}).
                {" "}The deal is recorded in the hub; enter the transfer on your official INTOPIA decision sheet.
              </span>
            </p>
          )}

          {productTrade && (
            <p className="flex gap-2 rounded-lg bg-secondary/60 p-3 text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
              <span>
                Avg. cost for {product}{grade} is <span className="font-mono text-foreground">${averageCost(product, grade)}</span>/unit.
                {type === "SELL" ? " Selling at or below it risks a transfer pricing penalty." : " Sellers accepting bids at or below it risk a transfer pricing penalty."}
              </span>
            </p>
          )}

          {confirming && (
            <p role="alert" className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs leading-relaxed text-foreground">
              This listing has unusual values (see the warnings above). You can still post it. Click <span className="font-semibold">Post anyway</span> to confirm, or edit the figures first.
            </p>
          )}
        </form>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" form="post-listing" variant={confirming ? "outline" : "default"}>
            {confirming ? "Post anyway" : "Post listing"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
