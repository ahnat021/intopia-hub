"use client"

import { useState, type FormEvent } from "react"
import { ArrowDownLeft, ArrowUpRight, FlaskConical, Handshake, Plus, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { REGIONS, teamLabel, type ListingType, type Region, type Team } from "@/lib/mock-data"
import type { NewListingInput } from "@/hooks/use-live-market"

const TYPE_OPTIONS: { value: ListingType; label: string; icon: LucideIcon; tone: string }[] = [
  { value: "BUY", label: "Buy", icon: ArrowDownLeft, tone: "text-emerald-400" },
  { value: "SELL", label: "Sell", icon: ArrowUpRight, tone: "text-rose-400" },
  { value: "PARTNERSHIP", label: "Joint Venture", icon: Handshake, tone: "text-sky-400" },
  { value: "RND", label: "R&D License", icon: FlaskConical, tone: "text-violet-400" },
]
const PRODUCTS = ["Product X", "Product Y", "Raw Materials", "R&D License", "Logistics Capacity"]
const PERIODS = ["P4", "P5", "P6", "P7", "P8"]

export function PostListingDialog({ team, onPost }: { team: Team; onPost: (input: NewListingInput) => void }) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<ListingType>("SELL")
  const [product, setProduct] = useState(PRODUCTS[0])
  const [region, setRegion] = useState<Region>("Global")
  const [neededBy, setNeededBy] = useState("P5")
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const qty = Number(String(form.get("quantity") ?? "").replace(/,/g, ""))
    const notes = String(form.get("notes") ?? "").trim().slice(0, 140)

    if (!Number.isInteger(qty) || qty <= 0 || qty > 100000) {
      setError("Quantity must be a whole number between 1 and 100,000.")
      return
    }

    onPost({
      type,
      teamId: team.id,
      product,
      quantity: `${qty.toLocaleString("en-US")} units`,
      region,
      neededBy,
      notes: notes || "—",
    })
    setError(null)
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setError(null)
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="shadow-lg shadow-primary/25">
          <Plus className="size-4" aria-hidden />
          Post a Listing
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Post a new listing</DialogTitle>
          <DialogDescription>
            Posting as <span className="font-mono text-foreground">{teamLabel(team.id)}</span> · {team.name}. Goes live
            for all teams immediately.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">Listing type</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TYPE_OPTIONS.map(({ value, label, icon: Icon, tone }) => (
                <label
                  key={value}
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                    type === value ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/60",
                  )}
                >
                  <input
                    type="radio"
                    name="type"
                    value={value}
                    checked={type === value}
                    onChange={() => setType(value)}
                    className="sr-only"
                  />
                  <Icon className={cn("size-5", tone)} aria-hidden />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="listing-product">Product</Label>
              <Select value={product} onValueChange={setProduct}>
                <SelectTrigger id="listing-product" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCTS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="listing-quantity">Quantity (units)</Label>
              <Input
                id="listing-quantity"
                name="quantity"
                inputMode="numeric"
                placeholder="e.g. 5000"
                maxLength={7}
                required
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="listing-region">Target region</Label>
              <Select value={region} onValueChange={(v) => setRegion(v as Region)}>
                <SelectTrigger id="listing-region" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="listing-needed">Needed by</Label>
              <Select value={neededBy} onValueChange={setNeededBy}>
                <SelectTrigger id="listing-needed" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((p) => (
                    <SelectItem key={p} value={p}>
                      Period {p.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="listing-notes">Notes</Label>
            <Textarea id="listing-notes" name="notes" placeholder="Terms, pricing, delivery details…" maxLength={140} rows={2} />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Publish listing</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
