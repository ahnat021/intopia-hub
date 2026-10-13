"use server"

import { db, isSupabaseConfigured } from "@/lib/supabaseClient"
import { getSession } from "@/lib/server/session"
import { newId } from "@/lib/server/security"
import { clearingFee, isValidPeriodSetting, promoActive } from "@/lib/constants"
import { PRODUCT_INFO, formatCompactUSD, formatUnits, productCode } from "@/lib/intopia-rules"
import {
  DEFAULT_SETTINGS,
  FINE_REASONS,
  MR_ITEMS,
  PROFESSOR_NAME,
  PROFESSOR_TEAM_ID,
  RATING_TAGS,
  isProfessor,
  threadIdFor,
  type ActivityKind,
  type AiReview,
  type AnnouncementTag,
  type Contract,
  type FineReason,
  type HubSettings,
  type Listing,
  type PartnerPair,
  type Rating,
  type Team,
  type TeamStats,
  type Thread,
} from "@/lib/domain"
import {
  EMPTY_SNAPSHOT,
  type ActionResult,
  type ContractDraft,
  type ContractOverride,
  type HubSnapshot,
  type MrOfferDraft,
  type NewListingInput,
  type RatingDraft,
} from "@/lib/hub-types"

type ThreadRow = { id: string; listingId: string; teamA: string; teamB: string; updatedAt: number; closed: boolean }

const fail = (error: string): ActionResult<never> => ({ ok: false, error })
const ok = <T,>(data: T): ActionResult<T> => ({ ok: true, data })
const num = (v: unknown) => (v == null ? null : Number(v))
const finite = (v: unknown, min = 0, max = 1e12) => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max

const label = (teams: Map<string, string>, id: string) => teams.get(id) ?? id
const toThread = (r: ThreadRow): Thread => ({ id: r.id, listingId: r.listingId, teamIds: [r.teamA, r.teamB], updatedAt: r.updatedAt, closed: r.closed })

function normalizeContract(c: Record<string, unknown>): Contract {
  const n = (k: string) => Number(c[k])
  return {
    ...(c as unknown as Contract),
    quantity: n("quantity"),
    unitPrice: n("unitPrice"),
    totalValue: n("totalValue"),
    interestRate: n("interestRate"),
    cashPct: n("cashPct"),
    ar1Pct: n("ar1Pct"),
    ar2Pct: n("ar2Pct"),
  }
}

async function teamNames() {
  const { data } = await db().from("teams").select("id, name")
  return new Map((data ?? []).map((t) => [t.id as string, t.name as string]))
}

async function getSettings(): Promise<HubSettings> {
  const { data } = await db().from("hub_settings").select("period, tradingLocked, deadlineAt").eq("id", 1).maybeSingle()
  return data ? { period: data.period, tradingLocked: data.tradingLocked, deadlineAt: num(data.deadlineAt) } : DEFAULT_SETTINGS
}

async function logActivity(kind: ActivityKind, message: string, teamId?: string) {
  await db().from("activity").insert({ id: newId("A"), kind, message, teamId: teamId ?? null })
}

async function postMessage(threadId: string, from: string, text: string, extra: { contractId?: string; mrOfferId?: string } = {}) {
  await Promise.all([
    db().from("messages").insert({ id: newId("M"), threadId, from, text, ...extra }),
    db().from("threads").update({ updatedAt: Date.now() }).eq("id", threadId),
  ])
}

/** Resolves the signed-in team and enforces KYC approval, bans and (optionally) the trading lock. */
async function requireTeam(opts: { tradable?: boolean } = {}): Promise<ActionResult<{ team: Team; settings: HubSettings }>> {
  if (!isSupabaseConfigured()) return fail("The hub database is not connected yet.")
  const session = await getSession()
  if (session?.role !== "team") return fail("Please sign in again.")
  const [{ data: team }, settings] = await Promise.all([db().from("teams").select("*").eq("id", session.teamId).maybeSingle(), getSettings()])
  if (!team) return fail("Team not found.")
  if (team.banned) return fail("This team has been removed from the hub.")
  if (team.kyc !== "approved") return fail("Your account is awaiting KYC approval.")
  if (opts.tradable && !team.certified) return fail("Sign the rules & liability waiver before trading.")
  if (opts.tradable && settings.tradingLocked) return fail("Contracts are locked for period processing.")
  return ok({ team: team as Team, settings })
}

async function requireAdmin(): Promise<ActionResult<true>> {
  if (!isSupabaseConfigured()) return fail("The hub database is not connected yet.")
  const session = await getSession()
  return session?.role === "admin" ? ok(true) : fail("Administrator access required.")
}

/** Admins, or an approved Professor Tim. Professor powers are a strict subset of admin powers. */
async function requireAdminOrProfessor(): Promise<ActionResult<{ actor: "admin" | "professor" }>> {
  if (!isSupabaseConfigured()) return fail("The hub database is not connected yet.")
  const session = await getSession()
  if (session?.role === "admin") return ok({ actor: "admin" })
  if (session?.role !== "team" || !isProfessor(session.teamId)) return fail("Only the hub administrator or Professor Tim can do this.")
  const { data: team } = await db().from("teams").select("kyc, banned").eq("id", session.teamId).maybeSingle()
  if (!team || team.banned || team.kyc !== "approved") return fail("Professor access is awaiting approval.")
  return ok({ actor: "professor" })
}

async function threadForMember(threadId: string, teamId: string) {
  const { data } = await db().from("threads").select("*").eq("id", threadId).maybeSingle()
  const row = data as ThreadRow | null
  return row && (row.teamA === teamId || row.teamB === teamId) ? row : null
}

function computeStats(teams: Team[], contracts: Pick<Contract, "initiatorId" | "counterpartyId">[], ratings: Rating[]) {
  const stats: Record<string, TeamStats> = {}
  for (const t of teams) {
    if (t.kyc !== "approved") continue
    stats[t.id] = { teamId: t.id, reputation: 70, completed: 0, ratingTotal: 0, ratingCount: 0, tagCounts: {} }
  }
  for (const c of contracts) {
    for (const id of [c.initiatorId, c.counterpartyId]) if (stats[id]) stats[id].completed++
  }
  for (const r of ratings) {
    const s = stats[r.toId]
    if (!s) continue
    s.ratingTotal += r.stars
    s.ratingCount++
    s.reputation += r.stars - 3
    for (const tag of r.tags) s.tagCounts[tag] = (s.tagCounts[tag] ?? 0) + 1
  }
  for (const s of Object.values(stats)) s.reputation = Math.max(0, Math.min(100, s.reputation + s.completed))
  return stats
}

function computeTopPartners(contracts: Pick<Contract, "initiatorId" | "counterpartyId" | "totalValue">[]): PartnerPair[] {
  const pairs = new Map<string, PartnerPair>()
  for (const c of contracts) {
    const teams = [c.initiatorId, c.counterpartyId].sort() as [string, string]
    const key = teams.join("-")
    const p = pairs.get(key) ?? { id: key, teams, deals: 0, volume: 0 }
    p.deals++
    p.volume += Number(c.totalValue)
    pairs.set(key, p)
  }
  return [...pairs.values()].sort((a, b) => b.volume - a.volume).slice(0, 3)
}

export async function getSnapshot(): Promise<HubSnapshot> {
  if (!isSupabaseConfigured()) return EMPTY_SNAPSHOT
  const session = await getSession()
  const isAdmin = session?.role === "admin"
  const viewerTeamId = session?.role === "team" ? session.teamId : null

  const [teamsRes, settings, listingsRes, activityRes, annRes, shipRes, finesRes, finalRes, ratingsRes, adminRes] = await Promise.all([
    db().from("teams").select("*").order("number"),
    getSettings(),
    db().from("listings").select("*").order("createdAt", { ascending: false }).limit(300),
    db().from("activity").select("*").order("at", { ascending: false }).limit(40),
    db().from("announcements").select("*").order("at", { ascending: false }).limit(20),
    db().from("shipments").select("*").limit(100),
    db().from("fines").select("*").order("at", { ascending: false }).limit(200),
    db().from("contracts").select("initiatorId, counterpartyId, totalValue").eq("status", "FINALIZED"),
    db().from("ratings").select("*"),
    db().from("admin_account").select("id", { count: "exact", head: true }),
  ])

  const rawTeams = (teamsRes.data ?? []) as Team[]
  const viewerTeam = viewerTeamId ? rawTeams.find((t) => t.id === viewerTeamId) : undefined
  // A banned or deleted team's cookie no longer grants a session.
  const viewer = isAdmin ? ({ role: "admin" } as const) : viewerTeam && !viewerTeam.banned ? ({ role: "team", teamId: viewerTeam.id } as const) : null

  const teams = rawTeams.map((t) => ({
    ...t,
    equity: num(t.equity),
    whatsapp: viewer ? t.whatsapp : null,
    email: isAdmin ? t.email : null,
  }))
  const ratings = ((ratingsRes.data ?? []) as Rating[]).map((r) => ({ ...r, tags: (r.tags ?? []).filter((t) => RATING_TAGS.includes(t)) }))
  const finalized = (finalRes.data ?? []) as Pick<Contract, "initiatorId" | "counterpartyId" | "totalValue">[]

  const base: HubSnapshot = {
    ...EMPTY_SNAPSHOT,
    configured: true,
    viewer,
    teams,
    settings,
    listings: ((listingsRes.data ?? []) as Listing[]).map((l) => ({ ...l, quantity: num(l.quantity), unitPrice: num(l.unitPrice) })),
    activity: activityRes.data ?? [],
    announcements: annRes.data ?? [],
    shipments: (shipRes.data ?? []).map((s) => ({ ...s, quantity: Number(s.quantity) })),
    fines: (finesRes.data ?? []).map((f) => ({ ...f, amountK: Number(f.amountK) })),
    stats: computeStats(teams, finalized, ratings),
    topPartners: computeTopPartners(finalized),
    ratings,
    adminConfigured: Boolean(adminRes.count),
  }
  if (!viewer) return base

  let threadRows: ThreadRow[] = []
  if (isAdmin) {
    threadRows = ((await db().from("threads").select("*")).data ?? []) as ThreadRow[]
  } else if (viewer.role === "team") {
    threadRows = ((await db().from("threads").select("*").or(`teamA.eq.${viewer.teamId},teamB.eq.${viewer.teamId}`)).data ?? []) as ThreadRow[]
  }
  const threadIds = threadRows.map((t) => t.id)
  const fetchScoped = async (table: string, orderBy?: string): Promise<{ data: unknown[] | null }> => {
    if (!isAdmin && !threadIds.length) return { data: [] }
    let query = db().from(table).select("*")
    if (!isAdmin) query = query.in("threadId", threadIds)
    if (orderBy) query = query.order(orderBy)
    const { data } = await query
    return { data }
  }

  const [messagesRes, contractsRes, mrRes] = await Promise.all([
    fetchScoped("messages", "at"),
    fetchScoped("contracts"),
    fetchScoped("mr_offers"),
  ])
  const contracts = ((contractsRes.data ?? []) as Record<string, unknown>[]).map(normalizeContract)
  const contractIds = contracts.map((c) => c.id)
  const reviewsRes = contractIds.length ? await db().from("ai_reviews").select("*").in("contractId", contractIds) : { data: [] }

  const kycQueue = isAdmin
    ? teams.filter((t) => t.kyc === "pending").map((t) => ({ teamId: t.id, email: t.email ?? "", at: t.registeredAt ?? 0 }))
    : []

  return {
    ...base,
    threads: Object.fromEntries(threadRows.map((t) => [t.id, toThread(t)])),
    messages: (messagesRes.data ?? []) as HubSnapshot["messages"],
    contracts,
    mrOffers: ((mrRes.data ?? []) as HubSnapshot["mrOffers"]).map((o) => ({ ...o, priceK: Number(o.priceK) })),
    aiReviews: Object.fromEntries(
      ((reviewsRes.data ?? []) as (AiReview & { contractId: string })[]).map(({ contractId, ...r }) => [contractId, { ...r, feeUSD: Number(r.feeUSD) }]),
    ),
    kycQueue,
  }
}

/* ----------------------------- Team actions ----------------------------- */

const LISTING_TYPES = ["BUY", "SELL", "PARTNERSHIP", "RND"]

export async function postListing(input: NewListingInput): Promise<ActionResult<Listing>> {
  const auth = await requireTeam({ tradable: true })
  if (!auth.ok) return auth
  const { team } = auth.data
  if (!LISTING_TYPES.includes(input.type) || !["X", "Y"].includes(input.product)) return fail("Invalid listing.")
  if (!Number.isInteger(input.grade) || input.grade < 0 || input.grade > 20) return fail("Invalid grade.")
  const isTrade = input.type === "BUY" || input.type === "SELL"
  if (isTrade && (!finite(input.quantity, 0.001, 1e6) || !finite(input.unitPrice, 0.01, 1e6))) return fail("Enter a valid quantity and price.")
  const listing: Listing = {
    id: newId("L"),
    status: "OPEN",
    type: input.type,
    teamId: team.id,
    title: String(input.title).slice(0, 120),
    product: input.product,
    grade: input.grade,
    quantity: isTrade ? input.quantity : null,
    unitPrice: isTrade ? input.unitPrice : null,
    region: input.region,
    delivery: isTrade ? input.delivery : null,
    notes: String(input.notes ?? "").slice(0, 500),
    createdAt: Date.now(),
  }
  const { error } = await db().from("listings").insert(listing)
  if (error) return fail("Could not post the listing.")
  const kind: ActivityKind = input.type === "PARTNERSHIP" ? "partnership" : input.type === "RND" ? "license" : "listing"
  await logActivity(kind, `${team.name} posted ${listing.title}`, team.id)
  return ok(listing)
}

export async function openThread(listingId: string): Promise<ActionResult<string>> {
  const auth = await requireTeam()
  if (!auth.ok) return auth
  const { team } = auth.data
  const { data: listing } = await db().from("listings").select("id, teamId, status").eq("id", listingId).maybeSingle()
  if (!listing) return fail("Listing not found.")
  if (listing.teamId === team.id) return fail("You can't negotiate on your own listing.")
  const id = threadIdFor(listing.id, team.id, listing.teamId)
  const { data: existing } = await db().from("threads").select("id").eq("id", id).maybeSingle()
  if (existing) return ok(id)
  if (listing.status === "CLOSED") return fail("This listing is closed.")
  const { error } = await db().from("threads").insert({ id, listingId: listing.id, teamA: team.id, teamB: listing.teamId })
  if (error && error.code !== "23505") return fail("Could not open the negotiation.")
  await postMessage(id, "system", `${team.name} opened a structured negotiation on this listing.`)
  if (listing.status === "OPEN") await db().from("listings").update({ status: "NEGOTIATING" }).eq("id", listing.id)
  return ok(id)
}

export async function draftContract(draft: ContractDraft, parentId?: string): Promise<ActionResult<Contract>> {
  const auth = await requireTeam({ tradable: true })
  if (!auth.ok) return auth
  const { team } = auth.data
  const thread = await threadForMember(draft.threadId, team.id)
  if (!thread || thread.closed) return fail("This negotiation is closed.")
  const counterpartyId = thread.teamA === team.id ? thread.teamB : thread.teamA
  if (![team.id, counterpartyId].includes(draft.providerId)) return fail("Invalid provider.")
  if (!["PRODUCT_SALE", "PATENT_LICENSE", "B2B_LOAN"].includes(draft.kind)) return fail("Invalid contract type.")
  if (Math.round(draft.cashPct + draft.ar1Pct + draft.ar2Pct) !== 100 || [draft.cashPct, draft.ar1Pct, draft.ar2Pct].some((p) => !finite(p, 0, 100)))
    return fail("Payment terms must total 100%.")
  if (!finite(draft.totalValue, 0.01) || !finite(draft.quantity, 0) || !finite(draft.unitPrice, 0) || !finite(draft.interestRate, 0, 100))
    return fail("Enter valid contract values.")
  const totalValue = draft.kind === "PRODUCT_SALE" ? Math.round(draft.quantity * 1000 * draft.unitPrice) : draft.totalValue

  let revision = 1
  if (parentId) {
    const { data: parent } = await db().from("contracts").select("id, revision, status, threadId").eq("id", parentId).maybeSingle()
    if (!parent || parent.threadId !== thread.id || parent.status !== "AWAITING") return fail("That proposal can no longer be countered.")
    revision = parent.revision + 1
    await db().from("contracts").update({ status: "COUNTERED" }).eq("id", parentId)
  }
  const contract: Contract = {
    ...draft,
    totalValue,
    listingId: thread.listingId,
    initiatorId: team.id,
    counterpartyId,
    id: newId("C"),
    status: "AWAITING",
    createdAt: Date.now(),
    parentId: parentId ?? null,
    revision,
  }
  const promoCode = (team as { promo_code_used?: string | null }).promo_code_used
  const withFee: Contract = { ...contract, clearing_fee: clearingFee(totalValue, promoCode), fee_waived: promoActive(promoCode) }
  let { error } = await db().from("contracts").insert(withFee)
  // Fall back if migration 002 hasn't added the fee columns yet.
  if (error && /clearing_fee|fee_waived/.test(error.message)) ({ error } = await db().from("contracts").insert(contract))
  else if (!error) Object.assign(contract, withFee)
  if (error) return fail("Could not submit the contract.")
  await postMessage(thread.id, team.id, parentId ? `Counter-offer R${revision} submitted, replacing R${revision - 1}.` : `Proposal R${revision} submitted for signature.`, {
    contractId: contract.id,
  })
  await db().from("listings").update({ status: "PENDING_SIGNATURE" }).eq("id", thread.listingId)
  const names = await teamNames()
  await logActivity("contract", `${team.name} sent ${label(names, counterpartyId)} a ${parentId ? "counter-offer" : "contract"} for signature`, team.id)
  return ok(contract)
}

async function applyFinalize(contract: Contract, byAdmin: boolean) {
  const finalized: Contract = { ...contract, status: "FINALIZED", finalizedAt: Date.now(), finalizedByAdmin: byAdmin || null }
  await db().from("contracts").update({ status: "FINALIZED", finalizedAt: finalized.finalizedAt, finalizedByAdmin: finalized.finalizedByAdmin }).eq("id", contract.id)
  await db().from("listings").update({ status: "CLOSED" }).eq("id", contract.listingId)
  await postMessage(
    contract.threadId,
    "system",
    byAdmin ? `Contract ${contract.id} was force-approved by the Hub Administrator.` : `Contract ${contract.id} officially finalized & locked by both teams.`,
  )
  const names = await teamNames()
  const other = contract.providerId === contract.initiatorId ? contract.counterpartyId : contract.initiatorId
  const [a, b] = [label(names, contract.initiatorId), label(names, contract.counterpartyId)]
  const message =
    contract.kind === "PRODUCT_SALE"
      ? `${a} & ${b} closed a ${formatUnits(contract.quantity)}-unit ${PRODUCT_INFO[contract.product].name} deal`
      : contract.kind === "PATENT_LICENSE"
        ? `${label(names, contract.providerId)} licensed ${productCode(contract.product, contract.grade)} technology to ${label(names, other)}`
        : `${label(names, contract.providerId)} extended a ${formatCompactUSD(contract.totalValue)} B2B loan to ${label(names, other)}`
  await logActivity(contract.kind === "PATENT_LICENSE" ? "license" : "deal", message, contract.initiatorId)
  if (contract.kind === "PRODUCT_SALE" && contract.delivery) {
    await db().from("shipments").insert({
      id: newId("S"),
      contractId: contract.id,
      sellerId: contract.providerId,
      buyerId: other,
      product: contract.product,
      grade: contract.grade,
      quantity: contract.quantity,
      mode: contract.delivery,
      region: contract.region,
    })
  }
  return finalized
}

async function loadContract(id: string) {
  const { data } = await db().from("contracts").select("*").eq("id", id).maybeSingle()
  return data ? normalizeContract(data) : null
}

export async function finalizeContract(contractId: string): Promise<ActionResult<Contract>> {
  const auth = await requireTeam({ tradable: true })
  if (!auth.ok) return auth
  const contract = await loadContract(contractId)
  if (!contract || contract.status !== "AWAITING" || contract.counterpartyId !== auth.data.team.id) return fail("This contract can't be signed.")
  return ok(await applyFinalize(contract, false))
}

export async function rejectAndClose(threadId: string): Promise<ActionResult> {
  const auth = await requireTeam()
  if (!auth.ok) return auth
  const { team } = auth.data
  const thread = await threadForMember(threadId, team.id)
  if (!thread || thread.closed) return fail("This negotiation is already closed.")
  await Promise.all([
    db().from("contracts").update({ status: "REJECTED" }).eq("threadId", threadId).eq("status", "AWAITING"),
    db().from("mr_offers").update({ status: "DECLINED" }).eq("threadId", threadId).eq("status", "OFFERED"),
    db().from("threads").update({ closed: true }).eq("id", threadId),
  ])
  await postMessage(threadId, "system", `${team.name} rejected the open terms and closed this negotiation.`)
  const { count } = await db().from("threads").select("id", { count: "exact", head: true }).eq("listingId", thread.listingId).eq("closed", false)
  await db().from("listings").update({ status: count ? "NEGOTIATING" : "OPEN" }).eq("id", thread.listingId).neq("status", "CLOSED")
  return ok(undefined)
}

export async function proposeMr(draft: MrOfferDraft): Promise<ActionResult> {
  const auth = await requireTeam({ tradable: true })
  if (!auth.ok) return auth
  const { team } = auth.data
  const thread = await threadForMember(draft.threadId, team.id)
  if (!thread || thread.closed) return fail("This negotiation is closed.")
  const item = MR_ITEMS.find((i) => i.id === draft.itemId)
  if (!item || !finite(draft.priceK, 0.01, 1e6)) return fail("Invalid market research offer.")
  const id = newId("MR")
  const buyerId = thread.teamA === team.id ? thread.teamB : thread.teamA
  const { error } = await db().from("mr_offers").insert({ ...draft, id, sellerId: team.id, buyerId, status: "OFFERED" })
  if (error) return fail("Could not send the offer.")
  await postMessage(thread.id, team.id, `Market research offer: ${item.label} for ${draft.area}.`, { mrOfferId: id })
  return ok(undefined)
}

export async function respondMr(offerId: string, accept: boolean): Promise<ActionResult> {
  const auth = await requireTeam()
  if (!auth.ok) return auth
  const { team } = auth.data
  const { data: offer } = await db().from("mr_offers").select("*").eq("id", offerId).maybeSingle()
  if (!offer || offer.status !== "OFFERED" || offer.buyerId !== team.id) return fail("This offer is no longer open.")
  await db().from("mr_offers").update({ status: accept ? "ACCEPTED" : "DECLINED" }).eq("id", offerId)
  const item = MR_ITEMS.find((i) => i.id === offer.itemId)
  await postMessage(
    offer.threadId,
    "system",
    accept
      ? `${team.name} accepted ${item?.label}. Settle via a service payment of ${formatCompactUSD(Number(offer.priceK) * 1000)} in the simulation.`
      : `${team.name} declined the market research offer.`,
  )
  if (accept) {
    const names = await teamNames()
    await logActivity("deal", `${label(names, offer.sellerId)} shared ${item?.label} with ${team.name}`, offer.sellerId)
  }
  return ok(undefined)
}

export async function submitRating(draft: RatingDraft): Promise<ActionResult> {
  const auth = await requireTeam()
  if (!auth.ok) return auth
  const { team } = auth.data
  const contract = await loadContract(draft.contractId)
  if (!contract || contract.status !== "FINALIZED" || ![contract.initiatorId, contract.counterpartyId].includes(team.id)) return fail("You can't rate this contract.")
  if (!Number.isInteger(draft.stars) || draft.stars < 1 || draft.stars > 5) return fail("Choose 1 to 5 stars.")
  const toId = contract.initiatorId === team.id ? contract.counterpartyId : contract.initiatorId
  const tags = [...new Set(draft.tags)].filter((t) => RATING_TAGS.includes(t))
  const { error } = await db().from("ratings").insert({ id: newId("R"), contractId: contract.id, fromId: team.id, toId, stars: draft.stars, tags })
  return error ? fail("You've already rated this partner.") : ok(undefined)
}

export async function signWaiver(signatoryName: string): Promise<ActionResult> {
  const auth = await requireTeam()
  if (!auth.ok) return auth
  const name = String(signatoryName ?? "").trim().slice(0, 80)
  if (name.length < 2) return fail("Type the full name of the team representative signing.")
  const id = auth.data.team.id
  const { error } = await db().from("teams").update({ certified: true, waiverName: name, waiverAt: Date.now() }).eq("id", id)
  // Databases that haven't run the waiver migration yet still record the signature flag.
  if (error) {
    const { error: fallback } = await db().from("teams").update({ certified: true }).eq("id", id)
    if (fallback) return fail("Could not record your signature. Try again.")
  }
  await logActivity("announcement", `${auth.data.team.name} signed the rules & liability waiver`, id)
  return ok(undefined)
}

export async function recordAiReview(contractId: string, review: AiReview): Promise<ActionResult> {
  const auth = await requireTeam()
  if (!auth.ok) return auth
  const contract = await loadContract(contractId)
  if (!contract || ![contract.initiatorId, contract.counterpartyId].includes(auth.data.team.id)) return fail("Contract not found.")
  const strings = (a: unknown) => (Array.isArray(a) ? a.filter((s): s is string => typeof s === "string").slice(0, 10).map((s) => s.slice(0, 240)) : [])
  await db()
    .from("ai_reviews")
    .upsert(
      {
        contractId,
        score: Math.max(0, Math.min(100, Math.round(review.score))),
        feeUSD: finite(review.feeUSD, 0, 1e7) ? review.feeUSD : 0,
        warnings: strings(review.warnings),
        strengths: strings(review.strengths),
      },
      { onConflict: "contractId", ignoreDuplicates: true },
    )
  return ok(undefined)
}

/* ----------------------------- Admin actions ----------------------------- */

export async function adminApprove(contractId: string): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth
  const contract = await loadContract(contractId)
  if (!contract || contract.status === "FINALIZED") return fail("Contract can't be approved.")
  await applyFinalize(contract, true)
  return ok(undefined)
}

export async function adminDelete(contractId: string): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth
  const contract = await loadContract(contractId)
  if (!contract) return fail("Contract not found.")
  await db().from("messages").delete().eq("contractId", contractId)
  const { error } = await db().from("contracts").delete().eq("id", contractId)
  if (error) return fail("Could not delete the trade.")
  await postMessage(contract.threadId, "system", `Contract ${contract.id} was removed by the Hub Administrator.`)
  if (contract.status === "FINALIZED" || contract.status === "AWAITING")
    await db().from("listings").update({ status: "NEGOTIATING" }).eq("id", contract.listingId)
  return ok(undefined)
}

export async function adminOverride(contractId: string, patch: ContractOverride): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth
  const values = [patch.quantity, patch.unitPrice, patch.totalValue, patch.cashPct, patch.ar1Pct, patch.ar2Pct]
  if (!values.every((v) => finite(v, 0)) || Math.round(patch.cashPct + patch.ar1Pct + patch.ar2Pct) !== 100) return fail("Invalid terms.")
  const contract = await loadContract(contractId)
  if (!contract) return fail("Contract not found.")
  const { quantity, unitPrice, totalValue, cashPct, ar1Pct, ar2Pct } = patch
  await db().from("contracts").update({ quantity, unitPrice, totalValue, cashPct, ar1Pct, ar2Pct, adminOverridden: true }).eq("id", contractId)
  await postMessage(contract.threadId, "system", `Terms of ${contract.id} were overridden by the Hub Administrator.`)
  return ok(undefined)
}

export async function deleteListing(listingId: string): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth
  const { error } = await db().from("listings").delete().eq("id", listingId)
  return error ? fail("Could not remove the listing.") : ok(undefined)
}

export async function toggleBan(teamId: string): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth
  const { data: team } = await db().from("teams").select("name, banned").eq("id", teamId).maybeSingle()
  if (!team) return fail("Team not found.")
  await db().from("teams").update({ banned: !team.banned }).eq("id", teamId)
  await logActivity("announcement", team.banned ? `${team.name} was reinstated by the Hub Administrator` : `${team.name} was removed from the hub`, teamId)
  return ok(undefined)
}

export async function approveKyc(teamId: string): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth
  const { data } = await db().from("teams").update({ kyc: "approved" }).eq("id", teamId).eq("kyc", "pending").select("name").maybeSingle()
  if (!data) return fail("No pending request for this team.")
  await logActivity("announcement", `${data.name} passed KYC verification and joined the hub`, teamId)
  return ok(undefined)
}

/** Rejection frees the roster slot so the real team can register again. */
export async function rejectKyc(teamId: string): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth
  await db().from("team_credentials").delete().eq("teamId", teamId)
  await db()
    .from("teams")
    .update({ kyc: "unregistered", company: null, region: null, whatsapp: null, email: null, registeredAt: null, certified: false })
    .eq("id", teamId)
  return ok(undefined)
}

export async function issueFine(teamId: string, amountK: number, reason: FineReason): Promise<ActionResult> {
  const auth = await requireAdminOrProfessor()
  if (!auth.ok) return auth
  if (!finite(amountK, 1, 1e6) || !FINE_REASONS.includes(reason)) return fail("Invalid fine.")
  const { data: team } = await db().from("teams").select("name").eq("id", teamId).maybeSingle()
  if (!team) return fail("Team not found.")
  const { error } = await db().from("fines").insert({ id: newId("F"), teamId, amountK: Math.round(amountK), reason })
  if (error) return fail("Could not record the penalty.")
  const by = auth.data.actor === "professor" ? `${PROFESSOR_NAME} issued an administrative penalty` : "Regulatory fine"
  await logActivity("fine", `${by}: ${team.name} fined ${formatCompactUSD(Math.round(amountK) * 1000)} for ${reason}`, teamId)
  return ok(undefined)
}

/** Professor Tim may set the period and deadline, but not lock or unlock trading. */
export async function setCalendar(period: string, deadlineAt: number | null): Promise<ActionResult> {
  const auth = await requireAdminOrProfessor()
  if (!auth.ok) return auth
  if (!isValidPeriodSetting(period)) return fail("Choose Auto or a period from the official schedule.")
  if (deadlineAt !== null && !finite(deadlineAt, 0, 1e14)) return fail("Invalid deadline.")
  const { error } = await db().from("hub_settings").update({ period, deadlineAt }).eq("id", 1)
  if (error) return fail("Could not update the calendar.")
  const who = auth.data.actor === "professor" ? PROFESSOR_NAME : "The Hub Administrator"
  await logActivity("announcement", `${who} set the game calendar to ${period}${deadlineAt ? `, deadline ${new Date(deadlineAt).toLocaleString("en-CA")}` : ""}`)
  return ok(undefined)
}

export async function setTeamEquity(teamId: string, equityK: number | null): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth
  if (equityK !== null && !finite(equityK, -1e9, 1e9)) return fail("Invalid equity.")
  await db().from("teams").update({ equity: equityK }).eq("id", teamId)
  return ok(undefined)
}

export async function updateSettings(patch: Partial<HubSettings>): Promise<ActionResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return auth
  const update: Partial<HubSettings> = {}
  if (typeof patch.tradingLocked === "boolean") update.tradingLocked = patch.tradingLocked
  if (typeof patch.period === "string" && isValidPeriodSetting(patch.period)) update.period = patch.period
  if (patch.deadlineAt === null || finite(patch.deadlineAt, 0, 1e14)) update.deadlineAt = patch.deadlineAt ?? null
  await db().from("hub_settings").update(update).eq("id", 1)
  if (update.tradingLocked !== undefined)
    await logActivity("announcement", update.tradingLocked ? "Contracts locked for period processing" : "Trading reopened by the Hub Administrator")
  return ok(undefined)
}

export async function postAnnouncement(tag: AnnouncementTag, title: string, body: string): Promise<ActionResult> {
  const auth = await requireAdminOrProfessor()
  if (!auth.ok) return auth
  if (!["Official", "Reminder", "Community"].includes(tag) || title.trim().length < 3) return fail("Add a title.")
  const row = { id: newId("N"), tag, title: title.trim().slice(0, 120), body: body.trim().slice(0, 600) }
  const author = auth.data.actor === "professor" ? PROFESSOR_TEAM_ID : "admin"
  const { error } = await db().from("announcements").insert({ ...row, author })
  // Fallback for databases that haven't added the "author" column yet.
  if (error) {
    const { error: fallback } = await db().from("announcements").insert(row)
    if (fallback) return fail("Could not post the announcement.")
  }
  return ok(undefined)
}

/** Admins can remove any announcement; Professor Tim only his own. */
export async function deleteAnnouncement(id: string): Promise<ActionResult> {
  const auth = await requireAdminOrProfessor()
  if (!auth.ok) return auth
  let query = db().from("announcements").delete().eq("id", id)
  if (auth.data.actor === "professor") query = query.eq("author", PROFESSOR_TEAM_ID)
  const { error } = await query
  return error ? fail("Could not remove the announcement.") : ok(undefined)
}
