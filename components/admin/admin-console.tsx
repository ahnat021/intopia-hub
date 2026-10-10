"use client"

import { useMemo, useState, type FormEvent } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, FileStack, KeyRound, LogOut, Pencil, Search, ShieldAlert, ShieldCheck, Trash2, Users } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import { useHub } from "@/lib/hub-store"
import { TEAMS, teamLabel, type Contract, type ContractStatus } from "@/lib/mock-data"
import { formatCompactUSD, formatUSD, productCode } from "@/lib/intopia-rules"
import { cn } from "@/lib/utils"
import { OverrideDialog } from "./override-dialog"

const ADMIN_PASSCODE = "INTOPIA-ADMIN"

const KIND_LABEL: Record<Contract["kind"], string> = {
  PRODUCT_SALE: "Product Sale",
  PATENT_LICENSE: "Patent License",
  B2B_LOAN: "B2B Loan",
}

const STATUS_STYLE: Record<ContractStatus, string> = {
  AWAITING: "bg-amber-500/10 text-amber-300 ring-amber-500/30",
  FINALIZED: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30",
  COUNTERED: "bg-sky-500/10 text-sky-300 ring-sky-500/30",
  REJECTED: "bg-rose-500/10 text-rose-300 ring-rose-500/30",
}

type LedgerFilter = "ALL" | "AWAITING" | "FINALIZED" | "CLOSED"

export function AdminConsole() {
  const { adminAuthed, setAdminAuthed } = useHub()
  return adminAuthed ? <AdminDashboard onSignOut={() => setAdminAuthed(false)} /> : <AdminGate onSuccess={() => setAdminAuthed(true)} />
}

function AdminGate({ onSuccess }: { onSuccess: () => void }) {
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (code.trim().toUpperCase() === ADMIN_PASSCODE) onSuccess()
    else setError("Incorrect administrator passcode.")
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-5 rounded-2xl border border-border bg-card/90 p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="size-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-xl font-semibold">Hub Administrator</h1>
            <p className="text-sm text-muted-foreground">Restricted to the simulation facilitator.</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="admin-code">Passcode</Label>
          <Input
            id="admin-code"
            type="password"
            autoComplete="off"
            value={code}
            onChange={(e) => {
              setCode(e.target.value)
              setError(null)
            }}
            aria-invalid={!!error}
            aria-describedby="admin-code-hint"
          />
          <p id="admin-code-hint" className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}>
            {error ?? (
              <>
                Demo passcode: <span className="font-mono text-foreground">{ADMIN_PASSCODE}</span>
              </>
            )}
          </p>
        </div>
        <Button type="submit">
          <KeyRound aria-hidden />
          Enter Console
        </Button>
        <Link href="/" className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" aria-hidden />
          Back to the hub
        </Link>
      </form>
    </main>
  )
}

function AdminDashboard({ onSignOut }: { onSignOut: () => void }) {
  const { contracts, bannedIds, toggleBan, adminApprove, adminDelete, adminOverride, stats } = useHub()
  const [filter, setFilter] = useState<LedgerFilter>("ALL")
  const [teamQuery, setTeamQuery] = useState("")
  const [editing, setEditing] = useState<Contract | null>(null)
  const [deleting, setDeleting] = useState<Contract | null>(null)

  const counts = useMemo(
    () => ({
      ALL: contracts.length,
      AWAITING: contracts.filter((c) => c.status === "AWAITING").length,
      FINALIZED: contracts.filter((c) => c.status === "FINALIZED").length,
      CLOSED: contracts.filter((c) => c.status === "COUNTERED" || c.status === "REJECTED").length,
    }),
    [contracts],
  )

  const ledger = useMemo(() => {
    const rows = contracts.filter((c) =>
      filter === "ALL" ? true : filter === "CLOSED" ? c.status === "COUNTERED" || c.status === "REJECTED" : c.status === filter,
    )
    return [...rows].sort((a, b) => b.createdAt - a.createdAt)
  }, [contracts, filter])

  const finalizedValue = useMemo(
    () => contracts.filter((c) => c.status === "FINALIZED").reduce((sum, c) => sum + c.totalValue, 0),
    [contracts],
  )

  const teams = useMemo(() => {
    const q = teamQuery.trim().toLowerCase()
    return TEAMS.filter((t) => !q || `${t.name} ${t.company} ${t.region}`.toLowerCase().includes(q))
  }, [teamQuery])

  const contractCount = (teamId: string) => contracts.filter((c) => c.initiatorId === teamId || c.counterpartyId === teamId).length

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" aria-hidden />
          </span>
          <div className="leading-tight">
            <h1 className="text-sm font-semibold">Admin Control Panel</h1>
            <p className="text-xs text-muted-foreground">Intopia Hub · Master oversight</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <ArrowLeft aria-hidden />
                <span className="hidden sm:inline">Hub</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={onSignOut}>
              <LogOut aria-hidden />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section aria-label="Summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryTile label="Pending signature" value={String(counts.AWAITING)} tone="amber" />
          <SummaryTile label="Finalized contracts" value={String(counts.FINALIZED)} tone="emerald" />
          <SummaryTile label="Finalized value" value={formatCompactUSD(finalizedValue)} />
          <SummaryTile label="Teams banned" value={String(bannedIds.length)} tone={bannedIds.length ? "rose" : undefined} />
        </section>

        <div className="grid gap-6 xl:grid-cols-12">
          <section aria-labelledby="ledger-title" className="flex min-w-0 flex-col rounded-xl border border-border bg-card/90 backdrop-blur-sm xl:col-span-8">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h2 id="ledger-title" className="flex items-center gap-2 font-semibold">
                <FileStack className="size-4 text-primary" aria-hidden />
                Master Ledger
              </h2>
              <Tabs value={filter} onValueChange={(v) => setFilter(v as LedgerFilter)}>
                <TabsList>
                  {(["ALL", "AWAITING", "FINALIZED", "CLOSED"] as const).map((f) => (
                    <TabsTrigger key={f} value={f} className="text-xs">
                      {f === "ALL" ? "All" : f === "AWAITING" ? "Pending" : f === "FINALIZED" ? "Finalized" : "Closed"}
                      <span className="ml-1 font-mono text-muted-foreground">{counts[f]}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contract</TableHead>
                    <TableHead>Parties</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead>Terms</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                        No contracts in this view.
                      </TableCell>
                    </TableRow>
                  )}
                  {ledger.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <p className="font-mono text-xs font-semibold">{c.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {KIND_LABEL[c.kind]} · {productCode(c.product, c.grade)}
                          {c.revision > 1 && ` · rev ${c.revision}`}
                        </p>
                      </TableCell>
                      <TableCell className="text-xs">
                        <p>{teamLabel(c.initiatorId)}</p>
                        <p className="text-muted-foreground">{"→ "}{teamLabel(c.counterpartyId)}</p>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        <p className="font-semibold">{formatUSD(c.totalValue)}</p>
                        {c.kind === "PRODUCT_SALE" && (
                          <p className="text-muted-foreground">
                            {c.quantity.toLocaleString("en-US")}K @ ${c.unitPrice}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {c.cashPct}/{c.ar1Pct}/{c.ar2Pct}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1">
                          <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ring-1", STATUS_STYLE[c.status])}>
                            {c.status === "AWAITING" ? "Pending" : c.status}
                          </span>
                          {c.adminOverridden && (
                            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary ring-1 ring-primary/30">Override</span>
                          )}
                          {c.finalizedByAdmin && (
                            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary ring-1 ring-primary/30">Forced</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {c.status === "AWAITING" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                adminApprove(c.id)
                                toast.success(`${c.id} force-approved`)
                              }}
                            >
                              <CheckCircle2 aria-hidden />
                              Approve
                            </Button>
                          )}
                          <Button size="icon-sm" variant="ghost" onClick={() => setEditing(c)} aria-label={`Override ${c.id}`}>
                            <Pencil aria-hidden />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleting(c)}
                            aria-label={`Delete ${c.id}`}
                          >
                            <Trash2 aria-hidden />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          <section aria-labelledby="teams-title" className="flex min-w-0 flex-col rounded-xl border border-border bg-card/90 backdrop-blur-sm xl:col-span-4">
            <div className="flex flex-col gap-3 border-b border-border px-4 py-3">
              <h2 id="teams-title" className="flex items-center gap-2 font-semibold">
                <Users className="size-4 text-primary" aria-hidden />
                Team Access
              </h2>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input value={teamQuery} onChange={(e) => setTeamQuery(e.target.value)} placeholder="Search teams" className="pl-8" aria-label="Search teams" />
              </div>
            </div>
            <ul className="flex max-h-[640px] flex-col divide-y divide-border overflow-y-auto">
              {teams.map((t) => {
                const banned = bannedIds.includes(t.id)
                const bankrupt = t.equity < 0
                return (
                  <li key={t.id} className={cn("flex items-center gap-3 px-4 py-2.5", banned && "bg-rose-500/5")}>
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary font-mono text-xs font-bold">{t.number}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {t.name} <span className="font-normal text-muted-foreground">· {t.company}</span>
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {bankrupt ? <span className="text-amber-300">Bankrupt</span> : t.region} · {contractCount(t.id)} contracts
                        {stats[t.id] && ` · ${stats[t.id].completed} completed`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {banned && <ShieldAlert className="size-4 text-rose-400" aria-hidden />}
                      <Label htmlFor={`ban-${t.id}`} className="sr-only">
                        {banned ? `Reinstate ${t.name}` : `Ban ${t.name}`}
                      </Label>
                      <Switch
                        id={`ban-${t.id}`}
                        checked={banned}
                        onCheckedChange={() => {
                          toggleBan(t.id)
                          toast(banned ? `${t.name} reinstated` : `${t.name} banned from the hub`)
                        }}
                        className="data-[state=checked]:bg-rose-500"
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
            <p className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">Toggle on to ban or kick a team. Access is revoked instantly.</p>
          </section>
        </div>
      </main>

      <OverrideDialog
        contract={editing}
        onClose={() => setEditing(null)}
        onSave={(id, patch) => {
          adminOverride(id, patch)
          toast.success(`${id} terms overridden`)
          setEditing(null)
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.id}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the contract from both teams and the ledger. Any linked shipment is cancelled. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleting) {
                  adminDelete(deleting.id)
                  toast(`${deleting.id} deleted`)
                }
                setDeleting(null)
              }}
            >
              Delete contract
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function SummaryTile({ label, value, tone }: { label: string; value: string; tone?: "amber" | "emerald" | "rose" }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-card/90 px-4 py-3 backdrop-blur-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "font-mono text-2xl font-semibold tabular-nums",
          tone === "amber" && "text-amber-300",
          tone === "emerald" && "text-emerald-300",
          tone === "rose" && "text-rose-400",
        )}
      >
        {value}
      </p>
    </div>
  )
}
