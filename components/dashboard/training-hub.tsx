"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { BadgeCheck, CheckCircle2, Circle, GraduationCap, Pause, Play } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const CURRICULUM = [
  { title: "Navigating the trading floor", detail: "Read listings, filter by region and grade, and open a negotiation drawer." },
  { title: "Structured negotiation", detail: "Propose trades, share Market Research #81, counter-offer, or reject & close. No free text." },
  { title: "Signing within the rules", detail: "Products X/Y, Grades 0–9, freight timing, the 25% lending cap and the Ontario disclaimer." },
]
const VIDEO_SECONDS = 90

function formatTime(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  certified: boolean
  onCertify: () => void
}

export function TrainingHub({ open, onOpenChange, certified, onCertify }: Props) {
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(certified ? VIDEO_SECONDS : 0)
  const [done, setDone] = useState<boolean[]>(() => CURRICULUM.map(() => certified))
  const [ack, setAck] = useState(certified)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (!playing) return
    // Simulated playback runs at 6x so the placeholder "finishes" in ~15s.
    timer.current = window.setInterval(() => {
      setElapsed((e) => {
        const next = Math.min(VIDEO_SECONDS, e + 6)
        if (next >= VIDEO_SECONDS) setPlaying(false)
        return next
      })
    }, 1000)
    return () => {
      if (timer.current) window.clearInterval(timer.current)
    }
  }, [playing])

  const progress = elapsed / VIDEO_SECONDS
  const activeChapter = Math.min(CURRICULUM.length - 1, Math.floor(progress * CURRICULUM.length))
  const allDone = done.every(Boolean)

  const certify = () => {
    onCertify()
    onOpenChange(false)
    toast.success("Training Certified", { description: "Listing tools are now unlocked for your team." })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="size-5 text-primary" aria-hidden />
            Training Hub
            {certified && (
              <span className="ml-1 inline-flex items-center gap-1 rounded-md bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">
                <BadgeCheck className="size-3" aria-hidden /> Certified
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Complete this short orientation before posting listings. You can still browse the marketplace while you learn.
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-secondary">
          <Image src="/images/training-poster.png" alt="Intopia Hub orientation video" fill sizes="(min-width: 640px) 640px, 100vw" className="object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-background/30">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              disabled={elapsed >= VIDEO_SECONDS}
              aria-label={playing ? "Pause orientation video" : "Play orientation video"}
              className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-105 disabled:opacity-0"
            >
              {playing ? <Pause className="size-7" aria-hidden /> : <Play className="ml-1 size-7" aria-hidden />}
            </button>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 bg-background/80 px-3 py-2 backdrop-blur">
            <span className="font-mono text-xs tabular-nums">{formatTime(elapsed)}</span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-primary transition-[width] duration-1000 ease-linear" style={{ width: `${progress * 100}%` }} />
            </div>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">{formatTime(VIDEO_SECONDS)}</span>
          </div>
        </div>

        <ol className="flex flex-col gap-2" aria-label="Curriculum">
          {CURRICULUM.map((step, i) => (
            <li
              key={step.title}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                playing && i === activeChapter ? "border-primary/50 bg-primary/5" : "border-border",
              )}
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-xs font-semibold">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-pretty text-xs leading-relaxed text-muted-foreground">{step.detail}</p>
              </div>
              <button
                type="button"
                onClick={() => setDone((d) => d.map((v, j) => (j === i ? !v : v)))}
                aria-pressed={done[i]}
                aria-label={`Mark "${step.title}" ${done[i] ? "incomplete" : "complete"}`}
                className="shrink-0 rounded-full p-0.5"
              >
                {done[i] ? <CheckCircle2 className="size-5 text-success" aria-hidden /> : <Circle className="size-5 text-muted-foreground" aria-hidden />}
              </button>
            </li>
          ))}
        </ol>

        <label className="flex items-start gap-2.5 rounded-lg bg-secondary/50 p-3 text-sm leading-relaxed">
          <Checkbox checked={ack} onCheckedChange={(v) => setAck(v === true)} disabled={!allDone || certified} className="mt-0.5" />
          <span className={cn(!allDone && "text-muted-foreground")}>
            I acknowledge that my team has completed the orientation and will trade within the Intopia rulebook.
          </span>
        </label>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {certified ? "Close" : "Remind me later"}
          </Button>
          {!certified && (
            <Button onClick={certify} disabled={!allDone || !ack}>
              <BadgeCheck aria-hidden />
              Complete &amp; get certified
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
