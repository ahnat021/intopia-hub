"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

function relative(ms: number, locale: string) {
  const rtf = new Intl.RelativeTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", { numeric: "auto", style: "short" })
  if (ms < MINUTE) return locale === "fr" ? "à l'instant" : "just now"
  if (ms < HOUR) return rtf.format(-Math.floor(ms / MINUTE), "minute")
  if (ms < DAY) return rtf.format(-Math.floor(ms / HOUR), "hour")
  return rtf.format(-Math.floor(ms / DAY), "day")
}

export function PostedAgo({ at, now, locale }: { at: number; now: number; locale: string }) {
  const age = Math.max(0, now - at)
  const exact = new Date(at).toLocaleString(locale === "fr" ? "fr-CA" : "en-CA", {
    timeZone: "America/Toronto",
    dateStyle: "medium",
    timeStyle: "short",
  })
  return (
    <time
      dateTime={new Date(at).toISOString()}
      title={exact}
      suppressHydrationWarning
      className="flex flex-col whitespace-nowrap leading-tight"
    >
      <span className={cn("text-sm", age < HOUR ? "font-semibold text-primary" : age > 2 * DAY ? "text-muted-foreground" : "text-foreground")}>
        {relative(age, locale)}
      </span>
      <span className="text-[11px] text-muted-foreground">{exact}</span>
    </time>
  )
}
