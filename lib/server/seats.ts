import "server-only"
import { Client } from "pg"
import { db } from "@/lib/supabaseClient"
import { PROFESSORS, isProfessor, professorByEmail } from "@/lib/domain"

export interface SeatRow {
  id: string
  number: number
  kyc: string
}

type SeatLookup = { team: SeatRow | null; error: string | null }

const CHECK_VIOLATION = "23514"

const selectSeat = (teamId: string) => db().from("teams").select("id, number, kyc").eq("id", teamId).maybeSingle<SeatRow>()

/**
 * Older databases only allow team numbers 0–75, which rejects the Team 99
 * professor seat. Widen that one range check once, then retry the insert.
 */
async function widenTeamNumberRange() {
  const url = process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL
  if (!url) throw new Error("POSTGRES_URL is not configured.")
  // Supabase uses a certificate chain Node does not trust by default; strip sslmode so the ssl option below applies.
  const client = new Client({ connectionString: url.replace(/([?&])sslmode=[^&]*&?/, "$1").replace(/[?&]$/, ""), ssl: { rejectUnauthorized: false } })
  await client.connect()
  try {
    await client.query(`alter table public.teams drop constraint if exists "teams_number_check"`)
    await client.query(`alter table public.teams add constraint "teams_number_check" check ("number" between 0 and 99)`)
  } finally {
    await client.end()
  }
}

/** Looks up a seat, creating a whitelisted professor seat on first use if its row is missing. */
export async function findSeat(teamId: string): Promise<SeatLookup> {
  const { data, error } = await selectSeat(teamId)
  if (error) return { team: null, error: error.message }
  if (data || !isProfessor(teamId)) return { team: data, error: null }

  const seat = PROFESSORS.find((p) => p.id === teamId)!
  const insert = () =>
    db().from("teams").upsert({ id: seat.id, number: seat.number, name: seat.name }, { onConflict: "id", ignoreDuplicates: true })

  let { error: insertError } = await insert()
  if (insertError?.code === CHECK_VIOLATION) {
    try {
      await widenTeamNumberRange()
    } catch (e) {
      return { team: null, error: `Could not enable the professor seat: ${e instanceof Error ? e.message : String(e)}` }
    }
    ;({ error: insertError } = await insert())
  }
  if (insertError) return { team: null, error: insertError.message }

  const retry = await selectSeat(teamId)
  return { team: retry.data, error: retry.error?.message ?? null }
}

/** Resolves the seat for a registration request: a whitelisted professor email wins over the posted team id. */
export function resolveSeatId(teamId: unknown, email: unknown): string {
  const professor = typeof email === "string" ? professorByEmail(email) : undefined
  if (professor) return professor.id
  return typeof teamId === "string" ? teamId.trim().slice(0, 8) : ""
}
