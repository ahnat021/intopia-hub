"use client"

import { useMemo, useState } from "react"
import { Crown, MessageSquare, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AREA_CODES, AREA_LABEL, DATALOG, PHASE_INFO, SCHEDULE, SCHEDULE_PHASES, activeScheduleEvent, formatToronto, freightCost, officialEmail, type AreaCode } from "@/lib/constants"
import { formatCompactUSD } from "@/lib/intopia-rules"
import { useHub } from "@/lib/hub-store"
import type { Team } from "@/lib/domain"
import { VisibilityPill } from "./visibility-pill"

export function CohortLogbook({ teams, viewerId, onMessage }: { teams: Team[]; viewerId: string; onMessage: (teamId: string) => void }) {
  const [q, setQ] = useState("")
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    return [...teams]
      .sort((a, b) => a.number - b.number)
      .filter((t) => !s || [t.name, t.company, String(t.number), t.team_leader_name, ...(t.team_members ?? []).map((m) => m.name)].some((v) => v?.toLowerCase().includes(s)))
  }, [teams, q])

  return (
    <section aria-labelledby="log-title" className="flex flex-col gap-6">
      <h2 id="log-title" className="font-sans font-semibold text-2xl">
        Team Logbook, Schedule & Datalog Tools
      </h2>
      <VisibilityPill scope="public" />

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input aria-label="Search teams" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search team, company or member" className="pl-9" />
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((t) => {
          const members = [...(t.team_members ?? [])].sort((a, b) => Number(b.isLeader) - Number(a.isLeader))
          const wa = t.whatsapp?.replace(/\D/g, "")
          return (
            <li key={t.id} className="glass-card flex flex-col gap-3 rounded-lg border border-border p-4">
              <div>
                <p className="font-mono text-xs text-gold">Team {String(t.number).padStart(2, "0")}</p>
                <h3 className="font-semibold">{t.company || t.name}</h3>
                <p className="font-mono text-xs text-muted-foreground">{officialEmail(t.number)}</p>
              </div>
              {members.length > 0 ? (
                <ul className="flex flex-col gap-1 text-sm">
                  {members.map((m) => (
                    <li key={m.name} className={m.isLeader ? "flex items-center gap-1.5 rounded-md border border-gold/60 bg-gold/10 px-2 py-1 font-semibold" : "px-2"}>
                      {m.isLeader && <Crown className="size-3.5 text-gold" aria-label="Team Leader" />}
                      {m.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Roster not submitted yet.</p>
              )}
              <div className="mt-auto flex flex-wrap items-center gap-2 text-sm">
                {wa && (
                  <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline">
                    WhatsApp {t.whatsapp}
                  </a>
                )}
                {t.contact_email && (
                  <a href={`mailto:${t.contact_email}`} className="text-muted-foreground underline-offset-2 hover:underline">
                    {t.contact_email}
                  </a>
                )}
                {t.id !== viewerId && (
                  <Button size="sm" variant="outline" className="ml-auto" onClick={() => onMessage(t.id)}>
                    <MessageSquare aria-hidden /> Message on Intopia Hub
                  </Button>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <div className="grid gap-6 lg:grid-cols-2">
        <ScheduleCard />
        <DatalogCalculator />
      </div>
    </section>
  )
}

function ScheduleCard() {
  const { settings } = useHub()
  const next = activeScheduleEvent(settings.period)
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-lg font-semibold">Official ADM 4711 Fall 2026 Schedule</h3>
      <p className="mb-3 text-xs text-muted-foreground">America/Toronto time</p>
      {next && (
        <p className="mb-3 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm">
          <span className="font-semibold text-primary">Current active period:</span> {next.label} · Deadline {formatToronto(next.at)}
        </p>
      )}
      {SCHEDULE_PHASES.map((p) => (
        <div key={p} className="mb-3">
          <h4 className="text-sm font-semibold">
            {PHASE_INFO[p].title} <span className="font-normal text-muted-foreground">· {PHASE_INFO[p].titleFr}</span>
          </h4>
          <p className="mb-1 text-xs text-muted-foreground">{PHASE_INFO[p].note}</p>
          <ul className="flex flex-col font-mono text-xs">
            {SCHEDULE.filter((e) => e.phase === p).map((e) => (
              <li
                key={e.id}
                aria-current={next?.id === e.id ? "step" : undefined}
                className={`flex justify-between gap-2 rounded px-2 py-1 ${next?.id === e.id ? "bg-primary/15 font-semibold text-primary" : next && e.at < next.at ? "text-muted-foreground line-through decoration-muted-foreground/40" : ""}`}
              >
                <span>
                  {e.label}
                  {next?.id === e.id && " · CURRENT"}
                </span>
                <span>{formatToronto(e.at)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function DatalogCalculator() {
  const [product, setProduct] = useState<"X" | "Y">("X")
  const [mode, setMode] = useState<"SURFACE" | "AIR">("SURFACE")
  const [from, setFrom] = useState<AreaCode>("NA")
  const [to, setTo] = useState<AreaCode>("EU")
  const [units, setUnits] = useState(100_000)
  const d = DATALOG[product]
  const f = freightCost(product, mode, from, to, units)
  const margin = (d.basePrice[from] - d.variableCost[from]) * units
  return (
    <div className="glass-card flex flex-col gap-3 rounded-lg border border-border p-4">
      <h3 className="font-sans font-semibold text-lg">Freight & Production Calculator</h3>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Product">
          <Select value={product} onValueChange={(v) => setProduct(v as "X" | "Y")}>
            <SelectTrigger aria-label="Product"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="X">X - Battery</SelectItem>
              <SelectItem value="Y">Y - Smartphone</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Mode">
          <Select value={mode} onValueChange={(v) => setMode(v as "SURFACE" | "AIR")}>
            <SelectTrigger aria-label="Shipping mode"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="SURFACE">Surface</SelectItem>
              <SelectItem value="AIR">Air</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="From">
          <AreaSelect value={from} onChange={setFrom} label="Origin area" />
        </Field>
        <Field label="To">
          <AreaSelect value={to} onChange={setTo} label="Destination area" />
        </Field>
        <Field label="Units">
          <Input type="number" min={0} value={units} onChange={(e) => setUnits(Math.max(0, Number(e.target.value) || 0))} aria-label="Units" />
        </Field>
      </div>
      <dl className="grid grid-cols-2 gap-2 font-mono text-xs">
        <dt className="text-muted-foreground">Base price / var. cost ({from})</dt>
        <dd className="text-right">${d.basePrice[from]} / ${d.variableCost[from]}</dd>
        <dt className="text-muted-foreground">Plant capacity ({from})</dt>
        <dd className="text-right">{d.capacity[from].toLocaleString("en-CA")}</dd>
        <dt className="text-muted-foreground">Freight ({f.perUnit}$/unit{f.discount ? `, −${Math.round(f.discount * 100)}%` : ""})</dt>
        <dd className="text-right">{formatCompactUSD(f.total)}</dd>
        <dt className="text-muted-foreground">Contribution before freight</dt>
        <dd className="text-right">{formatCompactUSD(margin)}</dd>
      </dl>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  )
}

function AreaSelect({ value, onChange, label }: { value: AreaCode; onChange: (v: AreaCode) => void; label: string }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as AreaCode)}>
      <SelectTrigger aria-label={label}><SelectValue /></SelectTrigger>
      <SelectContent>
        {AREA_CODES.map((a) => (
          <SelectItem key={a} value={a}>{AREA_LABEL[a]}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
