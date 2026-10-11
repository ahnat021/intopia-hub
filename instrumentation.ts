export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL
  if (!connectionString) {
    console.warn("[intopia] POSTGRES_URL not set; skipping schema migration")
    return
  }
  const [{ Client }, { SCHEMA_SQL }] = await Promise.all([import("pg"), import("./lib/server/schema")])
  const client = new Client({
    connectionString: connectionString.replace(/[?&]sslmode=[^&]*/, ""),
    ssl: { rejectUnauthorized: false },
  })
  try {
    await client.connect()
    await client.query(SCHEMA_SQL)
    console.log("[intopia] database schema is up to date")
  } catch (error) {
    console.error("[intopia] schema migration failed:", error instanceof Error ? error.message : error)
  } finally {
    await client.end().catch(() => {})
  }
}
