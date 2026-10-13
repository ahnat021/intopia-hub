"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { HubCrest } from "@/components/brand-mark"

const BOOT_KEY = "intopia_boot_seen"
const DURATION_MS = 2500
const STEPS = [
  "INITIALIZING INTOPIA HUB TRADE ENGINE...",
  "SYNCING 75 COHORT TEAMS (NA • EU • CHINA)...",
  "LOADING 37 DATALOG RESEARCH INSTRUMENTS...",
  "VERIFYING SUPABASE RLS ENCRYPTION...",
  "READY.",
]

const subscribe = () => () => {}
const readSeen = () => sessionStorage.getItem(BOOT_KEY) === "1"

export function BootSplash() {
  const seen = useSyncExternalStore(subscribe, readSeen, () => true)
  const [dismissed, setDismissed] = useState(false)
  const [progress, setProgress] = useState(0)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (seen || dismissed) return
    const start = performance.now()
    let frame = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / DURATION_MS)
      setProgress(p)
      if (p < 1) frame = requestAnimationFrame(tick)
      else setLeaving(true)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [seen, dismissed])

  useEffect(() => {
    if (!leaving) return
    const id = setTimeout(() => finish(), 450)
    return () => clearTimeout(id)
  })

  function finish() {
    sessionStorage.setItem(BOOT_KEY, "1")
    setDismissed(true)
  }

  if (seen || dismissed) return null

  const pct = Math.round(progress * 100)
  const step = STEPS[Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length))]

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading Intopia Hub"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 overflow-hidden bg-[#070B14] px-6 text-slate-100 transition-all duration-500 ${leaving ? "scale-105 opacity-0" : "scale-100 opacity-100"}`}
    >
      <div aria-hidden className="boot-grid pointer-events-none absolute inset-x-0 bottom-0 h-1/2" />
      <button
        type="button"
        onClick={finish}
        className="absolute right-4 top-4 rounded-md border border-slate-700 px-3 py-1.5 font-mono text-xs text-slate-300 transition-colors hover:border-amber-500/60 hover:text-amber-300"
      >
        Skip Intro
      </button>
      <HubCrest animated className="relative size-32 drop-shadow-[0_0_24px_rgba(16,185,129,0.45)] sm:size-40" />
      <div className="relative flex flex-col items-center gap-2 text-center">
        <p className="font-serif text-2xl font-bold tracking-[0.2em] text-amber-400 sm:text-3xl">INTOPIA HUB</p>
        <p className="font-mono text-[11px] tracking-[0.3em] text-emerald-400">GLOBAL B2B TRADE NETWORK</p>
      </div>
      <div className="relative flex w-full max-w-md flex-col gap-2">
        <div className="h-1 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-amber-500" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between gap-4 font-mono text-[11px] text-slate-400">
          <span className="truncate">{step}</span>
          <span className="tabular-nums text-amber-400">{pct}%</span>
        </div>
      </div>
    </div>
  )
}
