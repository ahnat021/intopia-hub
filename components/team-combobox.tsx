"use client"

import { useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import { Popover as PopoverPrimitive } from "radix-ui"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { TEAMS, TEAM_BY_ID, type Team } from "@/lib/mock-data"

interface Props {
  value: string | null
  onChange: (teamId: string) => void
  id?: string
  placeholder?: string
  /** Optional per-team status marker rendered at the end of each option. */
  renderMeta?: (team: Team) => ReactNode
  isDisabled?: (team: Team) => boolean
  className?: string
}

function matches(team: Team, q: string) {
  if (!q) return true
  const num = q.match(/^(?:team\s*|t)?(\d{1,2})$/)
  if (num) return String(team.number).startsWith(String(Number(num[1])))
  return `${team.name} ${team.company} ${team.region}`.toLowerCase().includes(q)
}

/** Searchable dropdown over the full 75-team roster with keyboard navigation. */
export function TeamCombobox({ value, onChange, id, placeholder = "Select a team (1–75)", renderMeta, isDisabled, className }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const listId = useId()
  const listRef = useRef<HTMLUListElement>(null)
  const selected = value ? TEAM_BY_ID[value] : null

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return TEAMS.filter((t) => matches(t, q))
  }, [query])

  const choose = (team: Team) => {
    if (isDisabled?.(team)) return
    onChange(team.id)
    setOpen(false)
    setQuery("")
  }

  const move = (delta: number) => {
    setActive((i) => {
      const next = Math.max(0, Math.min(results.length - 1, i + delta))
      listRef.current?.querySelector<HTMLElement>(`[data-index="${next}"]`)?.scrollIntoView({ block: "nearest" })
      return next
    })
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      move(1)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      move(-1)
    } else if (e.key === "Enter") {
      if (e.nativeEvent.isComposing || e.keyCode === 229) return
      e.preventDefault()
      const team = results[active]
      if (team) choose(team)
    }
  }

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o) setActive(Math.max(0, results.findIndex((t) => t.id === value)))
      }}
    >
      <PopoverPrimitive.Trigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          className={cn(
            "flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background/60 px-3 text-left text-sm shadow-xs outline-none transition-colors hover:border-primary/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            className,
          )}
        >
          {selected ? (
            <>
              <span className="flex size-6 shrink-0 items-center justify-center rounded bg-primary/15 font-mono text-xs font-bold text-primary">{selected.number}</span>
              <span className="min-w-0 flex-1 truncate">
                {selected.name} <span className="text-muted-foreground">· {selected.company}</span>
              </span>
            </>
          ) : (
            <span className="flex-1 text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          className="z-50 w-(--radix-popover-trigger-width) min-w-72 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActive(0)
              }}
              onKeyDown={onKeyDown}
              placeholder="Search by number, company or region"
              aria-label="Search teams"
              aria-controls={listId}
              aria-activedescendant={results[active] ? `${listId}-${results[active].id}` : undefined}
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ul ref={listRef} id={listId} role="listbox" aria-label="Teams" className="max-h-72 overflow-y-auto p-1">
            {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted-foreground">No teams match.</li>}
            {results.map((t, i) => {
              const disabled = isDisabled?.(t) ?? false
              return (
                <li
                  key={t.id}
                  id={`${listId}-${t.id}`}
                  data-index={i}
                  role="option"
                  aria-selected={t.id === value}
                  aria-disabled={disabled}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(t)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm",
                    i === active && "bg-accent text-accent-foreground",
                    disabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded bg-secondary font-mono text-xs font-semibold">{t.number}</span>
                  <span className="min-w-0 flex-1 truncate">
                    {t.company} <span className="text-xs text-muted-foreground">· {t.region}</span>
                  </span>
                  {renderMeta?.(t)}
                  {t.id === value && <Check className="size-4 text-primary" aria-hidden />}
                </li>
              )
            })}
          </ul>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
