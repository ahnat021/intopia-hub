"use client"

import { useState } from "react"
import useSWR from "swr"
import { AlertTriangle, RotateCcw, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { VisibilityPill } from "@/components/hub/visibility-pill"
import {
  adminBulkDelete,
  adminListRows,
  adminPhaseReset,
  adminRollback,
  adminScrubTeam,
  getIntelligence,
  type DeletableTable,
} from "@/lib/actions/clearinghouse-actions"
import { useHub } from "@/lib/hub-store"

const TABLES: { value: DeletableTable; label: string }[] = [
  { value: "listings", label: "Listings" },
  { value: "contracts", label: "Contracts" },
  { value: "threads", label: "Negotiation threads" },
  { value: "chat_messages", label: "Chat messages" },
  { value: "team_ratings", label: "Team ratings" },
  { value: "ratings", label: "Contract ratings" },
]

export function IntelligencePanel() {
  const { data, error, isLoading } = useSWR("intel", async () => {
    const r = await getIntelligence()
    if (!r.ok) throw new Error(r.error)
    return r.data
  })
  return (
    <div className="flex flex-col gap-6">
      <VisibilityPill scope="operator" />
      {isLoading && <p className="text-sm text-muted-foreground">Compiling intelligence…</p>}
      {error && <p className="text-sm text-destructive">{error.message}</p>}
      {data && (
        <>
          <Block title="Real-time VWAP vs. lowest live ask">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead className="text-right">VWAP</TableHead>
                  <TableHead className="text-right">Lowest ask</TableHead>
                  <TableHead className="text-right">Units</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.vwap.length === 0 && <EmptyRow cols={5} />}
                {data.vwap.map((r) => (
                  <TableRow key={`${r.product}${r.grade}${r.area}`}>
                    <TableCell className="font-mono">{r.product}{r.grade}</TableCell>
                    <TableCell>{r.area}</TableCell>
                    <TableCell className="text-right font-mono">${r.vwap.toFixed(2)}</TableCell>
                    <TableCell className={`text-right font-mono ${r.ask !== null && r.ask < r.vwap ? "text-success" : ""}`}>{r.ask === null ? "—" : `$${r.ask.toFixed(2)}`}</TableCell>
                    <TableCell className="text-right font-mono">{r.volume.toLocaleString("en-CA")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Block>
          <div className="grid gap-6 xl:grid-cols-2">
            <Block title="Supply / demand imbalance (bids ÷ asks)">
              <ul className="flex flex-col gap-2 text-sm">
                {data.imbalance.length === 0 && <li className="text-muted-foreground">No active book yet.</li>}
                {data.imbalance.map((r) => (
                  <li key={`${r.product}${r.grade}`} className="flex items-center gap-3">
                    <span className="w-10 font-mono">{r.product}{r.grade}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <span className="block h-full bg-primary" style={{ width: `${Math.min(100, r.ratio * 33)}%` }} />
                    </span>
                    <span className="w-24 text-right font-mono text-xs">
                      {r.buys}B / {r.sells}S
                    </span>
                  </li>
                ))}
              </ul>
            </Block>
            <Block title="Distressed counterparty radar">
              <ul className="flex flex-col gap-2 text-sm">
                {data.distressed.length === 0 && <li className="text-muted-foreground">No distress signals detected.</li>}
                {data.distressed.map((d) => (
                  <li key={d.teamId} className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                    <span>
                      <strong>{d.name}</strong> — {d.reasons.join(", ")}
                    </span>
                  </li>
                ))}
              </ul>
            </Block>
          </div>
          <Block title="Cohort compliance tracker">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Waiver</TableHead>
                  <TableHead>Promo</TableHead>
                  <TableHead className="text-right">Security flags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.compliance.map((c) => (
                  <TableRow key={c.teamId}>
                    <TableCell>
                      <span className="font-mono text-muted-foreground">{String(c.number).padStart(2, "0")}</span> {c.name}
                    </TableCell>
                    <TableCell className={c.waiverAt ? "text-success" : "text-muted-foreground"}>{c.waiverAt ? "Signed" : "Pending"}</TableCell>
                    <TableCell className="font-mono text-xs">{c.promo ?? "—"}</TableCell>
                    <TableCell className={`text-right font-mono ${c.flags ? "text-destructive" : ""}`}>{c.flags}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Block>
        </>
      )}
    </div>
  )
}

export function DataManagerPanel() {
  const hub = useHub()
  const [table, setTable] = useState<DeletableTable>("listings")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [scrubTeam, setScrubTeam] = useState("")
  const [hours, setHours] = useState("1")
  const { data: rows, mutate } = useSWR(["rows", table], async () => {
    const r = await adminListRows(table)
    if (!r.ok) throw new Error(r.error)
    return r.data
  })

  const confirmRun = async (message: string, fn: () => Promise<{ ok: boolean; error?: string }>) => {
    if (!window.confirm(message)) return
    const r = await fn()
    if (!r.ok) return toast.error(r.error ?? "Failed.")
    toast.success("Done.")
    setSelected(new Set())
    void mutate()
    void hub.refresh()
  }

  const toggle = (id: string) => setSelected((s) => (s.has(id) ? (s.delete(id), new Set(s)) : new Set(s.add(id))))
  const summary = (r: Record<string, unknown>) => String(r.title ?? r.body ?? r.product ?? r.comment ?? r.listingId ?? "").slice(0, 80)

  return (
    <div className="flex flex-col gap-6">
      <Block title="Bulk delete records">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <Select value={table} onValueChange={(v) => (setTable(v as DeletableTable), setSelected(new Set()))}>
            <SelectTrigger className="w-56" aria-label="Table">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TABLES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="destructive"
            size="sm"
            disabled={!selected.size}
            onClick={() => confirmRun(`Permanently delete ${selected.size} ${table} row(s)?`, () => adminBulkDelete(table, [...selected]))}
          >
            <Trash2 aria-hidden /> Delete {selected.size || ""} selected
          </Button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    aria-label="Select all"
                    checked={!!rows?.length && selected.size === rows.length}
                    onCheckedChange={(v) => setSelected(v ? new Set((rows ?? []).map((r) => String(r.id))) : new Set())}
                  />
                </TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Summary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows?.length === 0 && <EmptyRow cols={3} />}
              {rows?.map((r) => (
                <TableRow key={String(r.id)}>
                  <TableCell>
                    <Checkbox aria-label={`Select ${r.id}`} checked={selected.has(String(r.id))} onCheckedChange={() => toggle(String(r.id))} />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{String(r.id)}</TableCell>
                  <TableCell className="text-sm">{summary(r)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Block>

      <div className="grid gap-6 xl:grid-cols-3">
        <Block title="Team activity scrubber">
          <Select value={scrubTeam} onValueChange={setScrubTeam}>
            <SelectTrigger aria-label="Team to scrub">
              <SelectValue placeholder="Choose a team" />
            </SelectTrigger>
            <SelectContent>
              {[...hub.teams].sort((a, b) => a.number - b.number).map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  Team {String(t.number).padStart(2, "0")} · {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={!scrubTeam} onClick={() => confirmRun("Clear this team's listings, chats, ratings and contracts?", () => adminScrubTeam(scrubTeam, "trades"))}>
              Clear trades only
            </Button>
            <Button size="sm" variant="destructive" disabled={!scrubTeam} onClick={() => confirmRun("Full reset: trades, roster, waiver and KYC?", () => adminScrubTeam(scrubTeam, "full"))}>
              Full profile reset
            </Button>
          </div>
        </Block>
        <Block title="Rollback recent activity">
          <Select value={hours} onValueChange={setHours}>
            <SelectTrigger aria-label="Time window">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["0.25", "1", "3", "6", "24"].map((h) => (
                <SelectItem key={h} value={h}>
                  Last {h === "0.25" ? "15 minutes" : `${h} hour${h === "1" ? "" : "s"}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => confirmRun(`Delete all activity from the last ${hours}h?`, () => adminRollback(Date.now() - Number(hours) * 3600_000))}
          >
            <RotateCcw aria-hidden /> Roll back
          </Button>
        </Block>
        <Block title="Phase-transition reset">
          <p className="mb-3 text-sm text-muted-foreground">Wipe all test-run listings, chats, ratings and contracts. Teams, rosters, waivers and logins are kept.</p>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              if (window.prompt('Type "RESET" to wipe all test activity') !== "RESET") return
              void confirmRun("Final confirmation: wipe all marketplace activity?", adminPhaseReset)
            }}
          >
            Reset for Official Game
          </Button>
        </Block>
      </div>
    </div>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function EmptyRow({ cols }: { cols: number }) {
  return (
    <TableRow>
      <TableCell colSpan={cols} className="text-center text-muted-foreground">
        Nothing here yet.
      </TableCell>
    </TableRow>
  )
}
