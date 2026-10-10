"use client"

import { useEffect, useState } from "react"

/**
 * Counts down from `initialSeconds` against a wall-clock deadline so the
 * display never drifts when ticks are throttled (e.g. background tabs).
 */
export function useCountdown(initialSeconds: number) {
  const [remaining, setRemaining] = useState(initialSeconds)

  useEffect(() => {
    const deadline = Date.now() + initialSeconds * 1000
    let timeoutId: ReturnType<typeof setTimeout>

    const tick = () => {
      const msLeft = Math.max(0, deadline - Date.now())
      setRemaining(Math.ceil(msLeft / 1000))
      if (msLeft > 0) timeoutId = setTimeout(tick, msLeft % 1000 || 1000)
    }

    tick()
    return () => clearTimeout(timeoutId)
  }, [initialSeconds])

  return remaining
}

export function formatHMS(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map((n) => String(n).padStart(2, "0")) as [string, string, string]
}
