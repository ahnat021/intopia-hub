"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useHub } from "@/lib/hub-store"
import { RATING_TAGS, teamLabel, type Contract, type RatingTag } from "@/lib/mock-data"

const STAR_LABELS = ["Poor", "Below expectations", "Acceptable", "Great partner", "Outstanding"]

export function RatePartnerDialog({ contract, viewerId, onClose }: { contract: Contract | null; viewerId: string; onClose: () => void }) {
  const { submitRating } = useHub()
  const [stars, setStars] = useState(0)
  const [hover, setHover] = useState(0)
  const [tags, setTags] = useState<RatingTag[]>([])

  const partnerId = contract ? (contract.initiatorId === viewerId ? contract.counterpartyId : contract.initiatorId) : ""
  const shown = hover || stars

  const close = () => {
    setStars(0)
    setHover(0)
    setTags([])
    onClose()
  }

  const submit = () => {
    if (!contract || !stars) return
    submitRating({ contractId: contract.id, fromId: viewerId, toId: partnerId, stars, tags })
    toast.success(`Rated ${teamLabel(partnerId)} ${stars}/5`, { description: "Your rating now counts toward the Sportsmanship Leaderboard." })
    close()
  }

  const toggleTag = (tag: RatingTag) => setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]))

  return (
    <Dialog open={!!contract} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate your partner</DialogTitle>
          <DialogDescription>
            How was trading with <span className="font-semibold text-foreground">{teamLabel(partnerId)}</span> on {contract?.id}? Ratings are public on the Sportsmanship Leaderboard.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-2 py-2">
          <div role="radiogroup" aria-label="Star rating" className="flex gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={stars === n}
                aria-label={`${n} star${n > 1 ? "s" : ""}, ${STAR_LABELS[n - 1]}`}
                onClick={() => setStars(n)}
                onMouseEnter={() => setHover(n)}
                className="rounded-md p-1 outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Star className={cn("size-8", n <= shown ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} aria-hidden />
              </button>
            ))}
          </div>
          <p className="h-5 text-sm text-muted-foreground" aria-live="polite">{shown ? STAR_LABELS[shown - 1] : "Select a rating"}</p>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-xs font-medium text-muted-foreground">What stood out? (optional)</legend>
          <div className="flex flex-wrap gap-2">
            {RATING_TAGS.map((tag) => {
              const active = tags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-colors",
                    active ? "bg-primary text-primary-foreground ring-primary" : "text-muted-foreground ring-border hover:text-foreground",
                  )}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </fieldset>

        <DialogFooter>
          <Button variant="ghost" onClick={close}>Skip for now</Button>
          <Button onClick={submit} disabled={!stars}>Submit rating</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
