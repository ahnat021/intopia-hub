"use client"

import { useEffect, useState } from "react"

/** Seconds remaining until an absolute epoch-ms deadline; null when no deadline is scheduled. */
export function useDeadline(deadlineAt: number | null) {
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (deadlineAt == null) {
      setRemaining(null)
      return
    }
    let timeoutId: ReturnType<typeof setTimeout>
    const tick = () => {
      const msLeft = Math.max(0, deadlineAt - Date.now())
      setRemaining(Math.ceil(msLeft / 1000))
      if (msLeft > 0) timeoutId = setTimeout(tick, msLeft % 1000 || 1000)
    }
    tick()
    return () => clearTimeout(timeoutId)
  }, [deadlineAt])

  return remaining
}

export function formatHMS(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map((n) => String(n).padStart(2, "0")) as [string, string, string]
}
