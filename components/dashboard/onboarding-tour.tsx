"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, ArrowRight, Compass, FileSignature, GitBranch, LayoutGrid, Lock, Microscope, Search, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "intopia-hub:tour-seen"

const STEPS = [
  {
    icon: Compass,
    eyebrow: "Welcome",
    title: "Your B2B trading floor",
    body: "Intopia Hub is where teams find partners, negotiate terms, and lock in contracts. Production, offices, and capital transfers stay in the simulation itself; this hub only handles trade.",
    points: [
      { icon: LayoutGrid, text: "Browse listings from every team" },
      { icon: GitBranch, text: "Negotiate through structured proposals" },
      { icon: Lock, text: "Finalize binding digital contracts" },
    ],
  },
  {
    icon: LayoutGrid,
    eyebrow: "Step 1 · Marketplace",
    title: "Find the right deal",
    body: "The Live Marketplace streams Buy, Sell, and R&D listings. Filter by tab, region, or grade and search by product code. Use Post a Listing to advertise your own surplus or demand.",
    points: [
      { icon: Search, text: "Debounced search across products and teams" },
      { icon: Star, text: "Partner ratings show who trades fairly" },
    ],
  },
  {
    icon: GitBranch,
    eyebrow: "Step 2 · Structured Negotiations",
    title: "No chat, just offers",
    body: "Click Negotiate on any listing. Every move is a formal card, so nothing gets lost in a chat thread: propose a trade, share market research, or reject and close.",
    points: [
      { icon: FileSignature, text: "Propose Trade sends a priced contract card" },
      { icon: GitBranch, text: "Modify & Counter creates a new revision" },
      { icon: Microscope, text: "Share MR offers paid research for a service fee" },
    ],
  },
  {
    icon: Lock,
    eyebrow: "Step 3 · Contract Finalization",
    title: "Sign, lock, and rate",
    body: "When the counterparty clicks Accept & Finalize, the contract is locked and both teams enter it on their decision forms. Signing closes at 8:30 PM, then you rate your partner for the Sportsmanship Leaderboard.",
    points: [
      { icon: Lock, text: "Finalized contracts can't be edited" },
      { icon: Star, text: "Ratings feed the public leaderboard" },
    ],
  },
] as const

export function OnboardingTour({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const last = step === STEPS.length - 1

  useEffect(() => {
    if (open) setStep(0)
  }, [open])

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, "1")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : finish())}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <div className="flex items-center gap-3 border-b border-border bg-primary/10 px-6 py-5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <current.icon className="size-5" aria-hidden />
          </span>
          <DialogHeader className="gap-1 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">{current.eyebrow}</p>
            <DialogTitle className="text-xl text-balance">{current.title}</DialogTitle>
          </DialogHeader>
        </div>

        <div className="flex flex-col gap-4 px-6 py-5">
          <DialogDescription className="text-pretty leading-relaxed">{current.body}</DialogDescription>
          <ul className="flex flex-col gap-2">
            {current.points.map((p) => (
              <li key={p.text} className="flex items-center gap-3 rounded-lg bg-secondary/60 px-3 py-2.5 text-sm">
                <p.icon className="size-4 shrink-0 text-primary" aria-hidden />
                {p.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-4">
          <div className="flex gap-1.5" aria-label={`Step ${step + 1} of ${STEPS.length}`} role="img">
            {STEPS.map((s, i) => (
              <span key={s.eyebrow} className={cn("h-1.5 rounded-full transition-all", i === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30")} />
            ))}
          </div>
          <div className="flex gap-2">
            {step === 0 ? (
              <Button variant="ghost" size="sm" onClick={finish}>Skip tour</Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft aria-hidden />
                Back
              </Button>
            )}
            <Button size="sm" onClick={() => (last ? finish() : setStep((s) => s + 1))}>
              {last ? "Start trading" : "Next"}
              {!last && <ArrowRight aria-hidden />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function useFirstVisitTour() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setOpen(true)
  }, [])
  return [open, setOpen] as const
}
