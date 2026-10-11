"use server"

import { timingSafeEqual } from "node:crypto"

// Verified server-side so the credential never ships in the client bundle.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Intopia#Facilitator-2026"

export async function verifyAdminPassword(password: string): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 400))
  const given = Buffer.from(String(password))
  const expected = Buffer.from(ADMIN_PASSWORD)
  return given.length === expected.length && timingSafeEqual(given, expected)
}
