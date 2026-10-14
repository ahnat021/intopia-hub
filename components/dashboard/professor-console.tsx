"use client"

import { PERIOD_AUTO, SCHEDULE, forcePeriod, normalizePeriodSetting } from "@/lib/constants"
import { useMemo, useState } from "react"
import { CalendarClock, Gavel, Megaphone, Trash2, UserCog } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useHub } from "@/lib/hub-store"
import { FINE_REASONS, isProfessor, type AnnouncementTag, type FineReason } from "@/lib/domain"
import { useAuth } from "@/lib/auth-context"

const TAGS: AnnouncementTag[] = ["Official", "Reminder", "Community"]

const toLocalInput = (ms: number | null) => {
  if (!ms) return ""
  const d = new Date(ms)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

function AnnouncementTab() {
  const hub = useHub()
  const [tag, setTag] = useState<AnnouncementTag>("Official")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const viewerId = useAuth().team?.id
  const mine = hub.announcements.filter((a) => a.author === viewerId)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (await hub.postAnnouncement(tag, title, body)) {
      setTitle("")
      setBody("")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ann-tag">Tag</Label>
            <Select value={tag} onValueChange={(v) => setTag(v as AnnouncementTag)}>
              <SelectTrigger id="ann-tag" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>{TAGS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ann-title">Title</Label>
            <Input id="ann-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required minLength={3} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ann-body">Message to all students</Label>
          <Textarea id="ann-body" value={body} onChange={(e) => setBody(e.target.value)} maxLength={600} rows={4} />
        </div>
        <Button type="submit" className="self-end" disabled={title.trim().length < 3}>
          <Megaphone aria-hidden />
          Post announcement
        </Button>
      </form>

      {mine.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your announcements</p>
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
            {mine.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="truncate text-sm">{a.title}</span>
                <Button size="icon" variant="ghost" aria-label={`Delete ${a.title}`} onClick={() => void hub.deleteAnnouncement(a.id)}>
                  <Trash2 aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function CalendarTab() {
  const hub = useHub()
  const [period, setPeriod] = useState(normalizePeriodSetting(hub.settings.period))
  const [deadline, setDeadline] = useState(toLocalInput(hub.settings.deadlineAt))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    await hub.setCalendar(period, deadline ? new Date(deadline).getTime() : null)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Optional. Set the current game period and its contract deadline. Locking or reopening trading stays with the hub administrators.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cal-period">Current period</Label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger id="cal-period" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={PERIOD_AUTO}>Auto (follow official calendar)</SelectItem>
              {SCHEDULE.map((e) => <SelectItem key={e.id} value={forcePeriod(e.id)}>{e.id} · {e.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cal-deadline">Deadline (optional)</Label>
          <Input id="cal-deadline" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
      </div>
      <Button type="submit" className="self-end">
        <CalendarClock aria-hidden />
        Save calendar
      </Button>
    </form>
  )
}

function PenaltyTab() {
  const hub = useHub()
  const targets = useMemo(() => hub.teams.filter((t) => !isProfessor(t.id) && t.kyc === "approved"), [hub.teams])
  const [teamId, setTeamId] = useState("")
  const [amountK, setAmountK] = useState("")
  const [reason, setReason] = useState<FineReason>("Administrative Penalty")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (await hub.issueFine(teamId, Number(amountK), reason)) setAmountK("")
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pen-team">Team</Label>
        <Select value={teamId} onValueChange={setTeamId}>
          <SelectTrigger id="pen-team" className="w-full"><SelectValue placeholder={targets.length ? "Choose a team" : "No approved teams yet"} /></SelectTrigger>
          <SelectContent>{targets.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}{t.company ? ` · ${t.company}` : ""}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pen-amount">Amount (thousands $)</Label>
          <Input id="pen-amount" type="number" inputMode="numeric" min={1} value={amountK} onChange={(e) => setAmountK(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pen-reason">Reason</Label>
          <Select value={reason} onValueChange={(v) => setReason(v as FineReason)}>
            <SelectTrigger id="pen-reason" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>{FINE_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" variant="destructive" className="self-end" disabled={!teamId || !(Number(amountK) >= 1)}>
        <Gavel aria-hidden />
        Issue penalty
      </Button>
    </form>
  )
}

export function ProfessorConsole() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-gold/50 text-gold hover:text-gold">
          <UserCog aria-hidden />
          <span className="hidden md:inline">Professor tools</span>
          <span className="sr-only md:hidden">Professor tools</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Professor tools</DialogTitle>
          <DialogDescription>Announcements, the game calendar and administrative penalties.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="announce" className="gap-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="announce">Announce</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="penalty">Penalties</TabsTrigger>
          </TabsList>
          <TabsContent value="announce"><AnnouncementTab /></TabsContent>
          <TabsContent value="calendar"><CalendarTab /></TabsContent>
          <TabsContent value="penalty"><PenaltyTab /></TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
