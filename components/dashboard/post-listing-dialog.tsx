"use client"

import { useState, type FormEvent } from "react"
import { Plus } from "lucide-react"
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
import { LISTING_TYPE_LABEL, REGIONS, TEAMS, type ListingType, type Region } from "@/lib/mock-data"
import type { NewListingInput } from "@/hooks/use-live-market"

const TYPES = Object.keys(LISTING_TYPE_LABEL) as ListingType[]
const PERIODS = ["P4", "P5", "P6", "P7", "P8"]

export function PostListingDialog({ onPost }: { onPost: (input: NewListingInput) => void }) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<ListingType>("SELL")
  const [teamId, setTeamId] = useState(TEAMS[0].id)
  const [region, setRegion] = useState<Region>("Global")
  const [neededBy, setNeededBy] = useState("P5")
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const product = String(form.get("product") ?? "").trim().slice(0, 60)
    const quantity = String(form.get("quantity") ?? "").trim().slice(0, 30)
    const notes = String(form.get("notes") ?? "").trim().slice(0, 140)

    if (!product || !quantity) {
      setError("Product and quantity are required.")
      return
    }

    onPost({ type, teamId, product, quantity, region, neededBy, notes: notes || "—" })
    setError(null)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-lg shadow-primary/25">
          <Plus className="size-4" aria-hidden />
          Post a Listing
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Post a new listing</DialogTitle>
          <DialogDescription>Your listing goes live on the marketplace immediately for all teams.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="listing-type">Listing type</Label>
              <Select value={type} onValueChange={(v) => setType(v as ListingType)}>
                <SelectTrigger id="listing-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {LISTING_TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="listing-team">Posting as</Label>
              <Select value={teamId} onValueChange={setTeamId}>
                <SelectTrigger id="listing-team" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {TEAMS.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      T{String(t.number).padStart(2, "0")} · {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="listing-product">Product / offering</Label>
              <Input id="listing-product" name="product" placeholder="e.g. Product X Chips" maxLength={60} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="listing-quantity">Quantity / terms</Label>
              <Input id="listing-quantity" name="quantity" placeholder="e.g. 5,000 units" maxLength={30} required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="listing-region">Region</Label>
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
            <Textarea id="listing-notes" name="notes" placeholder="Terms, pricing, delivery details…" maxLength={140} rows={3} />
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
