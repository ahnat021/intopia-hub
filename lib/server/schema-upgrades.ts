import "server-only"
import { Client } from "pg"
import { db } from "@/lib/supabaseClient"

type InsertResult = { error: { message: string; code?: string } | null }

async function runDdl(statements: string[]) {
  const url = process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL
  if (!url) throw new Error("POSTGRES_URL is not configured.")
  // Supabase uses a certificate chain Node does not trust by default; strip sslmode so the ssl option below applies.
  const client = new Client({ connectionString: url.replace(/([?&])sslmode=[^&]*&?/, "$1").replace(/[?&]$/, ""), ssl: { rejectUnauthorized: false } })
  await client.connect()
  try {
    for (const sql of statements) await client.query(sql)
  } finally {
    await client.end()
  }
}

let assetUpgrade: Promise<void> | null = null

/** Older databases predate factory listings; add the `asset` column to listings and contracts once. */
function ensureAssetColumns() {
  assetUpgrade ??= runDdl([
    ...["listings", "contracts"].flatMap((t) => [
      `alter table public.${t} add column if not exists "asset" text not null default 'PRODUCT'`,
      `alter table public.${t} drop constraint if exists "${t}_asset_check"`,
      `alter table public.${t} add constraint "${t}_asset_check" check ("asset" in ('PRODUCT', 'FACTORY'))`,
    ]),
    `notify pgrst, 'reload schema'`,
  ]).catch((e) => {
    assetUpgrade = null
    throw e
  })
  return assetUpgrade
}

const missingAssetColumn = (error: InsertResult["error"]) => !!error && /asset/i.test(error.message) && error.code !== "23514"

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Inserts a row that may carry `asset`, upgrading the schema on first use if the column doesn't exist yet. */
export async function insertWithAsset(table: "listings" | "contracts", row: object): Promise<InsertResult> {
  const insert = () => db().from(table).insert(row) as unknown as Promise<InsertResult>
  let result = await insert()
  if (!missingAssetColumn(result.error)) return result
  try {
    await ensureAssetColumns()
  } catch (e) {
    return { error: { message: `Could not enable factory listings: ${e instanceof Error ? e.message : String(e)}` } }
  }
  // PostgREST reloads its schema cache asynchronously after the notify.
  for (const delay of [300, 700, 1500, 3000]) {
    await wait(delay)
    result = await insert()
    if (!missingAssetColumn(result.error)) return result
  }
  return result
}
