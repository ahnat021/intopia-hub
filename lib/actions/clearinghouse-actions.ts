"use server"

import { db } from "@/lib/supabaseClient"
import { getSession } from "@/lib/server/session"
import { newId } from "@/lib/server/security"
import { PROMO_CODE, PROMO_EXPIRES_AT } from "@/lib/constants"
import type { ActionResult } from "@/lib/hub-types"

const fail = (error: string): ActionResult<never> => ({ ok: false, error })
const ok = <T,>(data: T): ActionResult<T> => ({ ok: true, data })

async function currentTeamId(): Promise<string | null> {
  const s = await getSession()
  return s?.role === "team" ? s.teamId : null
}

/** Team 25 operators and the hub admin share the intelligence and data tools. */
async function requireOperator(): Promise<boolean> {
  const s = await getSession()
  if (!s) return false
  if (s.role === "admin") return true
  const { data } = await db().from("teams").select("number").eq("id", s.teamId).maybeSingle()
  return Number(data?.number) === 25
}

export interface TeamProfileInput {
  members: { name: string; isLeader: boolean }[]
  whatsapp: string
  contactEmail: string
}

export async function saveTeamProfile(input: TeamProfileInput): Promise<ActionResult> {
  const teamId = await currentTeamId()
  if (!teamId) return fail("Sign in as a team first.")
  const members = (input.members ?? [])
    .map((m) => ({ name: String(m.name ?? "").trim().slice(0, 80), isLeader: Boolean(m.isLeader) }))
    .filter((m) => m.name.length > 0)
  if (members.length < 1 || members.length > 8) return fail("Add between 1 and 8 team members.")
  const leaders = members.filter((m) => m.isLeader)
  if (leaders.length !== 1) return fail("Select exactly one Team Leader.")
  const whatsapp = String(input.whatsapp ?? "").replace(/[^\d+]/g, "").slice(0, 20)
  if (whatsapp.replace(/\D/g, "").length < 7) return fail("Enter a valid WhatsApp number.")
  const contactEmail = String(input.contactEmail ?? "").trim().slice(0, 120)
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return fail("Secondary contact email looks invalid.")
  const { error } = await db()
    .from("teams")
    .update({ team_members: members, team_leader_name: leaders[0].name, whatsapp, contact_email: contactEmail || null })
    .eq("id", teamId)
  return error ? fail("Could not save the team profile. Has migration 002 been run?") : ok(undefined)
}

export async function redeemPromo(code: string): Promise<ActionResult> {
  const teamId = await currentTeamId()
  if (!teamId) return fail("Sign in as a team first.")
  if (String(code ?? "").trim().toUpperCase() !== PROMO_CODE) return fail("That promo code isn't valid.")
  if (Date.now() > PROMO_EXPIRES_AT) return fail("INTOPIATRIAL expired when Market Test Period 7 ended.")
  const { error } = await db().from("teams").update({ promo_code_used: PROMO_CODE, promo_redeemed_at: Date.now() }).eq("id", teamId)
  return error ? fail("Could not redeem the code. Try again.") : ok(undefined)
}

export async function rateCounterparty(toTeam: string, stars: number, comment: string, stage: "inquiry" | "negotiation" | "post_contract"): Promise<ActionResult> {
  const teamId = await currentTeamId()
  if (!teamId) return fail("Sign in as a team first.")
  if (toTeam === teamId) return fail("You can't rate your own team.")
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return fail("Choose 1 to 5 stars.")
  if (!["inquiry", "negotiation", "post_contract"].includes(stage)) return fail("Invalid stage.")
  const { error } = await db()
    .from("team_ratings")
    .upsert(
      { id: newId("TR"), fromTeam: teamId, toTeam, stars, comment: String(comment ?? "").slice(0, 400), stage, createdAt: Date.now() },
      { onConflict: "fromTeam,toTeam" },
    )
  return error ? fail("Could not save your rating.") : ok(undefined)
}

export async function getRatingSummary(): Promise<Record<string, { avg: number; count: number }>> {
  const { data } = await db().from("team_ratings").select("toTeam,stars")
  const acc: Record<string, { sum: number; count: number }> = {}
  for (const r of data ?? []) {
    const k = String(r.toTeam)
    acc[k] ??= { sum: 0, count: 0 }
    acc[k].sum += Number(r.stars)
    acc[k].count += 1
  }
  return Object.fromEntries(Object.entries(acc).map(([k, v]) => [k, { avg: v.sum / v.count, count: v.count }]))
}

// ---------- Team 25 exclusive market intelligence ----------

export interface IntelligenceReport {
  vwap: { product: string; grade: number; area: string; vwap: number; ask: number | null; volume: number }[]
  imbalance: { product: string; grade: number; buys: number; sells: number; ratio: number }[]
  distressed: { teamId: string; name: string; reasons: string[] }[]
  compliance: { teamId: string; number: number; name: string; waiverAt: string | null; promo: string | null; flags: number }[]
}

export async function getIntelligence(): Promise<ActionResult<IntelligenceReport>> {
  if (!(await requireOperator())) return fail("Team 25 operator eyes only.")
  const [{ data: contracts }, { data: listings }, { data: teams }] = await Promise.all([
    db().from("contracts").select("initiatorId,counterpartyId,product,grade,region,quantity,unitPrice,status,createdAt"),
    db().from("listings").select("teamId,type,product,grade,region,unitPrice,status,createdAt,delivery"),
    db().from("teams").select("*").order("number"),
  ])
  const names = new Map((teams ?? []).map((t) => [String(t.id), String(t.name)]))
  const key = (p: unknown, g: unknown, a: unknown) => `${p}|${g}|${a}`

  const fills = new Map<string, { notional: number; qty: number }>()
  for (const c of contracts ?? []) {
    if (c.status !== "FINALIZED" || c.grade == null) continue
    const k = key(c.product, c.grade, c.region)
    const f = fills.get(k) ?? { notional: 0, qty: 0 }
    f.notional += Number(c.unitPrice) * Number(c.quantity)
    f.qty += Number(c.quantity)
    fills.set(k, f)
  }
  const asks = new Map<string, number>()
  for (const l of listings ?? []) {
    if (l.type !== "SELL" || l.status !== "ACTIVE" || l.unitPrice == null) continue
    const k = key(l.product, l.grade, l.region)
    asks.set(k, Math.min(asks.get(k) ?? Infinity, Number(l.unitPrice)))
  }
  const vwap = [...fills.entries()].map(([k, f]) => {
    const [product, grade, area] = k.split("|")
    return { product, grade: Number(grade), area, vwap: f.qty ? f.notional / f.qty : 0, ask: asks.get(k) ?? null, volume: f.qty }
  })

  const book = new Map<string, { buys: number; sells: number }>()
  for (const l of listings ?? []) {
    if (l.status !== "ACTIVE" || l.grade == null || (l.type !== "BUY" && l.type !== "SELL")) continue
    const k = `${l.product}|${l.grade}`
    const b = book.get(k) ?? { buys: 0, sells: 0 }
    if (l.type === "BUY") b.buys++
    else b.sells++
    book.set(k, b)
  }
  const imbalance = [...book.entries()]
    .map(([k, b]) => {
      const [product, grade] = k.split("|")
      return { product, grade: Number(grade), ...b, ratio: b.buys / Math.max(1, b.sells) }
    })
    .sort((a, b) => b.ratio - a.ratio)

  const reasons = new Map<string, string[]>()
  const flag = (id: string, r: string) => reasons.set(id, [...new Set([...(reasons.get(id) ?? []), r])])
  const byTeamAsks = new Map<string, number[]>()
  const now = Date.now()
  for (const l of [...(listings ?? [])].sort((a, b) => Number(a.createdAt) - Number(b.createdAt))) {
    if (l.type === "SELL" && l.unitPrice != null) byTeamAsks.set(String(l.teamId), [...(byTeamAsks.get(String(l.teamId)) ?? []), Number(l.unitPrice)])
    if (l.type === "BUY" && l.status === "ACTIVE" && now - Number(l.createdAt) < 6 * 3600_000 && /urgent|asap|now|immediate/i.test(String(l.delivery ?? ""))) flag(String(l.teamId), "Urgent short-deadline buy order")
  }
  for (const [id, prices] of byTeamAsks) {
    if (prices.length >= 2 && prices[prices.length - 1] < prices[0] * 0.85) flag(id, "Ask prices cut >15%")
  }
  for (const c of contracts ?? []) {
    if (c.status === "REJECTED" || c.status === "CANCELLED") flag(String(c.initiatorId), "Rejected / cancelled contracts")
  }
  const distressed = [...reasons.entries()].map(([teamId, r]) => ({ teamId, name: names.get(teamId) ?? teamId, reasons: r }))

  const compliance = (teams ?? []).map((t) => ({
    teamId: String(t.id),
    number: Number(t.number),
    name: String(t.name),
    waiverAt: t.certified ? (t.waiverAt ? new Date(Number(t.waiverAt)).toISOString() : (t.waiver_signed_at ?? "signed")) : null,
    promo: (t.promo_code_used as string | null) ?? null,
    flags: Number(t.security_flag_count ?? 0),
  }))

  return ok({ vwap, imbalance, distressed, compliance })
}

// ---------- Surgical admin data manager ----------

const DELETABLE = {
  listings: "createdAt",
  contracts: "createdAt",
  threads: "updatedAt",
  chat_messages: "createdAt",
  team_ratings: "createdAt",
  ratings: "at",
} as const
export type DeletableTable = keyof typeof DELETABLE

async function requireHubAdmin() {
  const s = await getSession()
  return s?.role === "admin"
}

export async function adminListRows(table: DeletableTable): Promise<ActionResult<Record<string, unknown>[]>> {
  if (!(await requireHubAdmin())) return fail("Admin only.")
  if (!(table in DELETABLE)) return fail("Unknown table.")
  const { data, error } = await db().from(table).select("*").order(DELETABLE[table], { ascending: false }).limit(300)
  return error ? fail(`Could not load ${table}.`) : ok(data ?? [])
}

export async function adminBulkDelete(table: DeletableTable, ids: string[]): Promise<ActionResult<number>> {
  if (!(await requireHubAdmin())) return fail("Admin only.")
  if (!(table in DELETABLE)) return fail("Unknown table.")
  const clean = ids.filter((i) => typeof i === "string" && i.length < 80).slice(0, 500)
  if (!clean.length) return fail("Select at least one row.")
  const { error, count } = await db().from(table).delete({ count: "exact" }).in("id", clean)
  return error ? fail("Delete failed.") : ok(count ?? clean.length)
}

async function wipeActivity(filter: { teamId?: string; since?: number }) {
  const d = db()
  const t = filter.teamId
  const since = filter.since ?? 0
  const ops: PromiseLike<unknown>[] = []
  if (t) {
    ops.push(
      d.from("chat_messages").delete().or(`fromTeam.eq.${t},toTeam.eq.${t}`),
      d.from("team_ratings").delete().or(`fromTeam.eq.${t},toTeam.eq.${t}`),
      d.from("contracts").delete().or(`initiatorId.eq.${t},counterpartyId.eq.${t}`),
      d.from("threads").delete().or(`teamA.eq.${t},teamB.eq.${t}`),
      d.from("listings").delete().eq("teamId", t),
    )
  } else {
    ops.push(
      d.from("chat_messages").delete().gte("createdAt", since),
      d.from("team_ratings").delete().gte("createdAt", since),
      d.from("ratings").delete().gte("at", since),
      d.from("mr_offers").delete().gte("createdAt", since),
      d.from("contracts").delete().gte("createdAt", since),
      d.from("threads").delete().gte("updatedAt", since),
      d.from("listings").delete().gte("createdAt", since),
    )
  }
  // Children first so foreign keys never block the parent deletes.
  const failed: string[] = []
  for (const op of ops) {
    const res = (await op) as { error?: { message: string } | null }
    if (res?.error) failed.push(res.error.message)
  }
  return failed
}

export async function adminScrubTeam(teamId: string, mode: "trades" | "full"): Promise<ActionResult> {
  if (!(await requireHubAdmin())) return fail("Admin only.")
  if (!/^[\w-]{1,60}$/.test(teamId)) return fail("Invalid team.")
  const failed = await wipeActivity({ teamId })
  if (failed.length) return fail(`Scrub incomplete: ${failed.length} table(s) could not be cleared.`)
  if (mode === "full") {
    const { error } = await db()
      .from("teams")
      .update({ kyc: "unregistered", team_members: [], team_leader_name: null, whatsapp: null, contact_email: null, certified: false, waiverName: null, waiverAt: null, promo_code_used: null })
      .eq("id", teamId)
    if (error) return fail("Activity cleared, but the profile reset failed.")
    // Columns added by migration 003; ignored if that migration hasn't been run yet.
    await db()
      .from("teams")
      .update({
        kyc_status: "unregistered",
        waiver_signed: false,
        waiver_signed_at: null,
        whatsapp_number: null,
        security_flag_count: 0,
        last_intrusion_reported_at: null,
      })
      .eq("id", teamId)
  }
  return ok(undefined)
}

export async function adminPhaseReset(): Promise<ActionResult> {
  if (!(await requireHubAdmin())) return fail("Admin only.")
  const failed = await wipeActivity({ since: 0 })
  return failed.length ? fail(`Reset incomplete: ${failed.length} table(s) could not be cleared.`) : ok(undefined)
}

export async function adminRollback(sinceMs: number): Promise<ActionResult> {
  if (!(await requireHubAdmin())) return fail("Admin only.")
  if (!Number.isFinite(sinceMs) || sinceMs <= 0 || sinceMs > Date.now()) return fail("Pick a valid time window.")
  const failed = await wipeActivity({ since: Math.floor(sinceMs) })
  return failed.length ? fail(`Rollback incomplete: ${failed.length} table(s) could not be cleared.`) : ok(undefined)
}
