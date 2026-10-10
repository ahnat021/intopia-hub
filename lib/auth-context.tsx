"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { TEAM_BY_ID, updateTeamContact, type Team } from "@/lib/mock-data"

/**
 * Simulated team authentication for the prototype. Accounts and the active session
 * live in sessionStorage so they survive reloads within the tab — this is NOT secure auth.
 */

const ACCOUNTS_KEY = "intopia-hub:accounts:v2"
const SESSION_KEY = "intopia-hub:session:v2"

export interface TeamAccount {
  teamId: string
  pin: string
  whatsapp: string
  email: string
}

export type SignInResult = "ok" | "bad-pin" | "no-account" | "bankrupt"

type AuthStatus = "loading" | "signedOut" | "signedIn"

interface AuthValue {
  status: AuthStatus
  team: Team | null
  findAccount: (teamId: string) => TeamAccount | undefined
  register: (account: TeamAccount) => void
  signIn: (teamId: string, pin: string) => SignInResult
  signOut: () => void
}

/** Two pre-registered teams so a reviewer can switch between both sides of a deal. */
export const DEMO_ACCOUNTS: Record<string, TeamAccount> = {
  t07: { teamId: "t07", pin: "1234", whatsapp: "+1 629 1611", email: "team7@intopia.trade" },
  t18: { teamId: "t18", pin: "1234", whatsapp: "+49 846 5714", email: "team18@intopia.trade" },
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    if (value === null) window.sessionStorage.removeItem(key)
    else window.sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be unavailable (private mode / sandboxed iframe); in-memory state still works.
  }
}

export const isBankrupt = (teamId: string) => (TEAM_BY_ID[teamId]?.equity ?? 0) < 0

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading")
  const [accounts, setAccounts] = useState<Record<string, TeamAccount>>(DEMO_ACCOUNTS)
  const [teamId, setTeamId] = useState<string | null>(null)

  useEffect(() => {
    const stored = { ...DEMO_ACCOUNTS, ...readStorage<Record<string, TeamAccount>>(ACCOUNTS_KEY, {}) }
    for (const a of Object.values(stored)) updateTeamContact(a.teamId, a.whatsapp, a.email)
    const sessionId = readStorage<string | null>(SESSION_KEY, null)
    setAccounts(stored)
    if (sessionId && stored[sessionId] && !isBankrupt(sessionId)) {
      setTeamId(sessionId)
      setStatus("signedIn")
    } else {
      setStatus("signedOut")
    }
  }, [])

  const startSession = useCallback((account: TeamAccount) => {
    updateTeamContact(account.teamId, account.whatsapp, account.email)
    writeStorage(SESSION_KEY, account.teamId)
    setTeamId(account.teamId)
    setStatus("signedIn")
  }, [])

  const findAccount = useCallback((id: string) => accounts[id], [accounts])

  const register = useCallback(
    (account: TeamAccount) => {
      if (isBankrupt(account.teamId)) return
      setAccounts((prev) => {
        const next = { ...prev, [account.teamId]: account }
        writeStorage(ACCOUNTS_KEY, next)
        return next
      })
      startSession(account)
    },
    [startSession],
  )

  const signIn = useCallback(
    (id: string, pin: string): SignInResult => {
      if (isBankrupt(id)) return "bankrupt"
      const account = accounts[id]
      if (!account) return "no-account"
      if (account.pin !== pin) return "bad-pin"
      startSession(account)
      return "ok"
    },
    [accounts, startSession],
  )

  const signOut = useCallback(() => {
    writeStorage(SESSION_KEY, null)
    setTeamId(null)
    setStatus("signedOut")
  }, [])

  const value = useMemo<AuthValue>(
    () => ({ status, team: teamId ? (TEAM_BY_ID[teamId] ?? null) : null, findAccount, register, signIn, signOut }),
    [status, teamId, findAccount, register, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
