"use client"

import { useMemo, useState, type FormEvent } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  CheckCircle2,
  FileStack,
  LayoutDashboard,
  Loader2,
  LogOut,
  Megaphone,
  Pencil,
  Search,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Store,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { BrandMark } from "@/components/brand-mark"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/lib/auth-context"
import { useHub } from "@/lib/hub-store"
import { formatClock, isOperator, teamLabel, type AnnouncementTag, type Contract, type ContractStatus, type Team } from "@/lib/domain"
import { formatCompactUSD, formatUSD, productCode } from "@/lib/intopia-rules"
import { cn } from "@/lib/utils"
import { AdminLogin } from "./admin-login"
import { FinesPanel, KycQueuePanel } from "./compliance-panels"
import { OverrideDialog } from "./override-dialog"
import { DataManagerPanel, IntelligencePanel } from "./power-tools"

const KIND_LABEL: Record<Contract["kind"], string> = {
  PRODUCT_SALE: "Product Sale",
  PATENT_LICENSE: "Patent License",
  B2B_LOAN: "B2B Loan",
}

const STATUS_STYLE: Record<ContractStatus, string> = {
  AWAITING: "bg-warning/10 text-warning ring-warning/30",
  FINALIZED: "bg-success/10 text-success ring-success/30",
  COUNTERED: "bg-primary/10 text-primary ring-primary/30",
  REJECTED: "bg-destructive/10 text-destructive ring-destructive/30",
}

type Section = "overview" | "teams" | "ledger" | "listings" | "compliance" | "intel" | "data" | "settings"

const SECTIONS: { id: Section; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "teams", label: "Team Management", icon: Users },
  { id: "ledger", label: "Global Ledger", icon: FileStack },
  { id: "listings", label: "Listings", icon: Store },
  { id: "compliance", label: "Compliance", icon: ShieldAlert },
  { id: "intel", label: "Team 25 Intelligence", icon: ShieldCheck },
  { id: "data", label: "Data Manager", icon: Trash2 },
  { id: "settings", label: "Hub Settings", icon: Settings2 },
]

export function AdminConsole() {
  const { status, isAdmin } = useAuth()
  if (status === "loading") {
    return (
      <main className="flex min-h-dvh items-center justify-center" aria-busy>
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </main>
    )
  }
  return isAdmin ? <AdminDashboard /> : <AdminLogin />
}

function AdminDashboard() {
  const { signOut } = useAuth()
  const { kycQueue } = useHub()
  const [section, setSection] = useState<Section>("overview")

  return (
    <div className="flex min-h-dvh flex-col bg-background lg:flex-row">
      <aside className="flex flex-col border-b border-border bg-sidebar text-sidebar-foreground lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="flex items-center gap-3 px-4 py-4">
          <BrandMark className="size-10" />
          <div className="min-w-0">
            <p className="truncate font-semibold">Intopia Hub</p>
            <p className="text-xs text-muted-foreground">Admin Portal</p>
          </div>
        </div>
        <nav aria-label="Admin sections" className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-1 lg:flex-col lg:overflow-visible">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              aria-current={section === s.id ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                section === s.id ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <s.icon className="size-4" aria-hidden />
              {s.label}
              {s.id === "compliance" && kycQueue.length > 0 && (
                <span className="ml-auto rounded-full bg-gold px-1.5 font-mono text-[10px] font-bold text-gold-foreground">{kycQueue.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="hidden flex-col gap-1 border-t border-sidebar-border p-2 lg:flex">
          <Button asChild variant="ghost" size="sm" className="justify-start">
            <Link href="/">
              <ArrowLeft aria-hidden />
              Back to hub
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="justify-start" onClick={() => void signOut()}>
            <LogOut aria-hidden />
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6 lg:px-8">
          <h1 className="text-lg font-semibold tracking-tight">{SECTIONS.find((s) => s.id === section)?.label}</h1>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => void signOut()}>
              <LogOut aria-hidden />
              <span className="sr-only">Sign out</span>
            </Button>
          </div>
        </header>
        <main className="flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          {section === "overview" && <Overview onNavigate={setSection} />}
          {section === "teams" && <TeamManagement />}
          {section === "ledger" && <GlobalLedger />}
          {section === "listings" && <ListingModeration />}
          {section === "compliance" && (
            <div className="grid gap-6 xl:grid-cols-2">
              <KycQueuePanel />
              <FinesPanel />
            </div>
          )}
          {section === "intel" && <IntelligencePanel />}
          {section === "data" && <DataManagerPanel />}
          {section === "settings" && <HubSettingsPanel />}
        </main>
      </div>
    </div>
  )
}

function Stat({ label, value, onClick }: { label: string; value: string | number; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/50"
    >
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="font-mono text-2xl font-bold tabular-nums">{value}</span>
    </button>
  )
}

function Overview({ onNavigate }: { onNavigate: (s: Section) => void }) {
  const { teams, contracts, listings, kycQueue, settings, platformFeesUSD } = useHub()
  const registered = teams.filter((t) => t.kyc !== "unregistered")
  const volume = contracts.filter((c) => c.status === "FINALIZED").reduce((sum, c) => sum + c.totalValue, 0)

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Registered teams" value={registered.length} onClick={() => onNavigate("teams")} />
        <Stat label="Pending KYC" value={kycQueue.length} onClick={() => onNavigate("compliance")} />
        <Stat label="Open listings" value={listings.filter((l) => l.status !== "CLOSED").length} onClick={() => onNavigate("listings")} />
        <Stat label="Contracts" value={contracts.length} onClick={() => onNavigate("ledger")} />
        <Stat label="Finalized volume" value={formatCompactUSD(volume)} onClick={() => onNavigate("ledger")} />
        <Stat label="AI fees" value={formatCompactUSD(platformFeesUSD)} onClick={() => onNavigate("compliance")} />
      </div>
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
        <div>
          <p className="text-sm font-semibold">
            Period {settings.period} · {settings.tradingLocked ? "Trading locked" : "Trading open"}
          </p>
          <p className="text-sm text-muted-foreground">
            {settings.deadlineAt ? `Contracts lock at ${formatClock(settings.deadlineAt)}` : "No lock deadline scheduled."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onNavigate("settings")}>
          <Settings2 aria-hidden />
          Manage period
        </Button>
      </section>
      <GlobalLedger compact />
    </>
  )
}

const KYC_STYLE: Record<Team["kyc"], string> = {
  unregistered: "text-muted-foreground",
  pending: "text-warning",
  approved: "text-success",
  rejected: "text-destructive",
}

function TeamManagement() {
  const { teams, stats, toggleBan, approveKyc, rejectKyc, setTeamEquity } = useHub()
  const [query, setQuery] = useState("")
  const [showAll, setShowAll] = useState(false)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return teams.filter(
      (t) =>
        (showAll || t.kyc !== "unregistered") &&
        (!q || t.name.toLowerCase().includes(q) || (t.company ?? "").toLowerCase().includes(q) || (t.email ?? "").toLowerCase().includes(q)),
    )
  }, [query, showAll, teams])

  const saveEquity = async (team: Team, raw: string) => {
    const value = raw.trim() === "" ? null : Number(raw)
    if (value !== null && !Number.isFinite(value)) return toast.error("Equity must be a number in $K")
    if (value === team.equity) return
    if (await setTeamEquity(team.id, value)) toast.success(`${team.name} equity updated`)
  }

  return (
    <section aria-label="Teams" className="flex flex-col rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search team, company or email" className="pl-8" aria-label="Search teams" />
        </div>
        <Label className="flex items-center gap-2 text-sm font-normal">
          <Switch checked={showAll} onCheckedChange={setShowAll} />
          Include unregistered slots
        </Label>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>KYC</TableHead>
              <TableHead className="text-right">Rep.</TableHead>
              <TableHead className="w-32">Equity ($K)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No teams have registered yet.
                </TableCell>
              </TableRow>
            )}
            {rows.map((t) => (
              <TableRow key={t.id} className={cn(t.banned && "opacity-60")}>
                <TableCell className="font-medium">
                  <span className={cn(isOperator(t.id) && "text-gold")}>{t.name}</span>
                  {t.certified && <ShieldCheck className="ml-1 inline size-3.5 text-success" aria-label="Training certified" />}
                </TableCell>
                <TableCell className="max-w-48 truncate">{t.company ?? "—"}</TableCell>
                <TableCell className="max-w-56 truncate font-mono text-xs">{t.email ?? "—"}</TableCell>
                <TableCell className={cn("text-xs font-semibold capitalize", KYC_STYLE[t.kyc])}>{t.banned ? "banned" : t.kyc}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{stats[t.id]?.reputation ?? "—"}</TableCell>
                <TableCell>
                  <Input
                    key={`${t.id}-${t.equity}`}
                    defaultValue={t.equity ?? ""}
                    inputMode="decimal"
                    aria-label={`${t.name} equity in thousands`}
                    className="h-8 font-mono"
                    onBlur={(e) => void saveEquity(t, e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    {t.kyc === "pending" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => void approveKyc(t.id)}>
                          Approve
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => void rejectKyc(t.id)}>
                          Reject
                        </Button>
                      </>
                    )}
                    {t.kyc !== "unregistered" && (
                      <Button
                        size="sm"
                        variant={t.banned ? "outline" : "ghost"}
                        className={cn(!t.banned && "text-destructive hover:text-destructive")}
                        onClick={() => void toggleBan(t.id)}
                      >
                        {t.banned ? "Reinstate" : "Ban"}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}

type LedgerFilter = "ALL" | "AWAITING" | "FINALIZED" | "CLOSED"

function GlobalLedger({ compact = false }: { compact?: boolean }) {
  const { contracts, adminApprove, adminDelete, adminOverride } = useHub()
  const [filter, setFilter] = useState<LedgerFilter>("ALL")
  const [editing, setEditing] = useState<Contract | null>(null)

  const rows = useMemo(() => {
    const filtered = contracts.filter((c) =>
      filter === "ALL" ? true : filter === "CLOSED" ? c.status === "COUNTERED" || c.status === "REJECTED" : c.status === filter,
    )
    const sorted = [...filtered].sort((a, b) => b.createdAt - a.createdAt)
    return compact ? sorted.slice(0, 8) : sorted
  }, [compact, contracts, filter])

  const remove = async (c: Contract) => {
    if (await adminDelete(c.id)) toast.success(`Trade ${c.id} deleted`)
    else toast.error("Could not delete the trade")
  }

  return (
    <section aria-labelledby="ledger-title" className="flex flex-col rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <h2 id="ledger-title" className="font-semibold">
          {compact ? "Latest contracts" : "Master Ledger"}
        </h2>
        {!compact && (
          <div role="group" aria-label="Filter contracts" className="flex flex-wrap gap-1">
            {(["ALL", "AWAITING", "FINALIZED", "CLOSED"] as const).map((f) => (
              <Button key={f} size="sm" variant={filter === f ? "default" : "ghost"} onClick={() => setFilter(f)} aria-pressed={filter === f}>
                {f === "ALL" ? "All" : f === "AWAITING" ? "Pending" : f === "FINALIZED" ? "Finalized" : "Closed"}
              </Button>
            ))}
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Parties</TableHead>
              <TableHead>Terms</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No contracts yet. Trades appear here as soon as teams submit them.
                </TableCell>
              </TableRow>
            )}
            {rows.map((c) => {
              const deletable = c.status === "AWAITING" || c.status === "FINALIZED"
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">
                    {c.id}
                    <span className="ml-1 text-muted-foreground">R{c.revision}</span>
                  </TableCell>
                  <TableCell className="text-xs">{KIND_LABEL[c.kind]}</TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    {teamLabel(c.initiatorId)} → {teamLabel(c.counterpartyId)}
                  </TableCell>
                  <TableCell className="font-mono text-xs whitespace-nowrap">
                    {c.kind === "PRODUCT_SALE" ? `${productCode(c.product, c.grade)} · ${c.quantity}K @ ${formatUSD(c.unitPrice)}` : c.kind === "B2B_LOAN" ? `${c.interestRate}% APR` : productCode(c.product, c.grade)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">{formatCompactUSD(c.totalValue)}</TableCell>
                  <TableCell>
                    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ring-1 ring-inset", STATUS_STYLE[c.status])}>{c.status}</span>
                    {c.adminOverridden && <span className="ml-1 text-[10px] text-gold">edited</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {c.status === "AWAITING" && (
                        <Button size="icon-sm" variant="ghost" aria-label={`Force-approve ${c.id}`} onClick={() => void adminApprove(c.id)}>
                          <CheckCircle2 aria-hidden />
                        </Button>
                      )}
                      <Button size="icon-sm" variant="ghost" aria-label={`Edit terms of ${c.id}`} onClick={() => setEditing(c)}>
                        <Pencil aria-hidden />
                      </Button>
                      {deletable && (
                        <Button size="sm" variant="destructive" onClick={() => void remove(c)}>
                          <Trash2 aria-hidden />
                          Delete Trade
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      <OverrideDialog
        contract={editing}
        onClose={() => setEditing(null)}
        onSave={(id, patch) => {
          void adminOverride(id, patch).then((ok) => (ok ? toast.success("Terms overridden") : toast.error("Override failed")))
          setEditing(null)
        }}
      />
    </section>
  )
}

function ListingModeration() {
  const { listings, deleteListing } = useHub()
  const [query, setQuery] = useState("")
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return listings.filter((l) => !q || l.title.toLowerCase().includes(q) || teamLabel(l.teamId).toLowerCase().includes(q))
  }, [listings, query])

  return (
    <section aria-label="Listings" className="flex flex-col rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search listings" className="pl-8" aria-label="Search listings" />
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Listing</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Posted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  The marketplace is empty.
                </TableCell>
              </TableRow>
            )}
            {rows.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="max-w-64 truncate font-medium">{l.title}</TableCell>
                <TableCell>{teamLabel(l.teamId)}</TableCell>
                <TableCell className="text-xs">{l.type}</TableCell>
                <TableCell className="text-xs">{l.status}</TableCell>
                <TableCell className="font-mono text-xs">{formatClock(l.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => void deleteListing(l.id).then((ok) => ok && toast.success("Listing removed"))}
                  >
                    <Trash2 aria-hidden />
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}

function toLocalInput(ms: number | null) {
  if (!ms) return ""
  const d = new Date(ms)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

function HubSettingsPanel() {
  const { settings, updateSettings, announcements, postAnnouncement, deleteAnnouncement } = useHub()
  const [period, setPeriod] = useState(settings.period)
  const [deadline, setDeadline] = useState(toLocalInput(settings.deadlineAt))
  const [tag, setTag] = useState<AnnouncementTag>("Official")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")

  const savePeriod = async (e: FormEvent) => {
    e.preventDefault()
    const ok = await updateSettings({ period: period.trim() || settings.period, deadlineAt: deadline ? new Date(deadline).getTime() : null })
    if (ok) toast.success("Period settings saved")
  }

  const announce = async (e: FormEvent) => {
    e.preventDefault()
    if (await postAnnouncement(tag, title, body)) {
      setTitle("")
      setBody("")
      toast.success("Announcement published")
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section aria-labelledby="period-title" className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5">
        <h2 id="period-title" className="font-semibold">
          Trading period
        </h2>
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
          <div>
            <p className="text-sm font-medium">Lock all contracts</p>
            <p className="text-xs text-muted-foreground">Blocks new listings, drafts and signatures for every team.</p>
          </div>
          <Switch
            checked={settings.tradingLocked}
            onCheckedChange={(v) => void updateSettings({ tradingLocked: v })}
            aria-label="Lock trading"
          />
        </div>
        <form onSubmit={savePeriod} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="period">Period label</Label>
              <Input id="period" value={period} onChange={(e) => setPeriod(e.target.value)} maxLength={12} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="deadline">Contract lock time</Label>
              <Input id="deadline" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="self-start">
            Save period
          </Button>
        </form>
      </section>

      <section aria-labelledby="announce-title" className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5">
        <h2 id="announce-title" className="flex items-center gap-2 font-semibold">
          <Megaphone className="size-4 text-primary" aria-hidden />
          Announcements
        </h2>
        <form onSubmit={announce} className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-[9rem_1fr]">
            <Select value={tag} onValueChange={(v) => setTag(v as AnnouncementTag)}>
              <SelectTrigger aria-label="Announcement tag">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["Official", "Reminder", "Community"] as const).map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" aria-label="Announcement title" maxLength={120} />
          </div>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message to every team" aria-label="Announcement body" maxLength={600} />
          <Button type="submit" className="self-start" disabled={!title.trim() || !body.trim()}>
            Publish
          </Button>
        </form>
        <ul className="divide-y divide-border rounded-lg border border-border">
          {announcements.length === 0 && <li className="p-4 text-center text-sm text-muted-foreground">No announcements published.</li>}
          {announcements.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground">
                  {a.tag} · {formatClock(a.at)}
                </p>
              </div>
              <Button size="icon-sm" variant="ghost" aria-label={`Delete ${a.title}`} onClick={() => void deleteAnnouncement(a.id)}>
                <Trash2 aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
