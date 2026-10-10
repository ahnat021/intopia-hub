"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { TEAM_BY_ID, registerTeam, type Team } from "@/lib/mock-data"

/**
 * Simulated team authentication for the prototype. Accounts and the active session
 * live in sessionStorage so they survive reloads within the tab — this is NOT secure auth.
 */

const ACCOUNTS_KEY = "intopia-hub:accounts"
const SESSION_KEY = "intopia-hub:session"

export interface TeamAccount {
  name: string
  pin: string
  whatsapp: string
  email: string
}

type AuthStatus = "loading" | "signedOut" | "signedIn"

interface AuthValue {
  status: AuthStatus
  team: Team | null
  findAccount: (name: string) => TeamAccount | undefined
  register: (account: TeamAccount) => void
  signIn: (name: string, pin: string) => boolean
  signOut: () => void
}

const DEMO_ACCOUNTS: Record<string, TeamAccount> = {
  "helix dynamics": {
    name: "Helix Dynamics",
    pin: "1234",
    whatsapp: "+1 415 555 0142",
    email: "trade@helix-dynamics.team",
  },
}

const accountKey = (name: string) => name.trim().toLowerCase()

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
    // Storage can be unavailable (private mode / sandboxed iframe); the in-memory state still works.
  }
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading")
  const [accounts, setAccounts] = useState<Record<string, TeamAccount>>(DEMO_ACCOUNTS)
  const [teamId, setTeamId] = useState<string | null>(null)

  useEffect(() => {
    const stored = { ...DEMO_ACCOUNTS, ...readStorage<Record<string, TeamAccount>>(ACCOUNTS_KEY, {}) }
    for (const a of Object.values(stored)) registerTeam(a.name, a.whatsapp, a.email)
    const sessionKey = readStorage<string | null>(SESSION_KEY, null)
    const active = sessionKey ? stored[sessionKey] : undefined
    setAccounts(stored)
    if (active) {
      setTeamId(registerTeam(active.name, active.whatsapp, active.email).id)
      setStatus("signedIn")
    } else {
      setStatus("signedOut")
    }
  }, [])

  const startSession = useCallback((account: TeamAccount) => {
    const team = registerTeam(account.name, account.whatsapp, account.email)
    writeStorage(SESSION_KEY, accountKey(account.name))
    setTeamId(team.id)
    setStatus("signedIn")
  }, [])

  const findAccount = useCallback((name: string) => accounts[accountKey(name)], [accounts])

  const register = useCallback(
    (account: TeamAccount) => {
      setAccounts((prev) => {
        const next = { ...prev, [accountKey(account.name)]: account }
        writeStorage(ACCOUNTS_KEY, next)
        return next
      })
      startSession(account)
    },
    [startSession],
  )

  const signIn = useCallback(
    (name: string, pin: string) => {
      const account = accounts[accountKey(name)]
      if (!account || account.pin !== pin) return false
      startSession(account)
      return true
    },
    [accounts, startSession],
  )

  const signOut = useCallback(() => {
    writeStorage(SESSION_KEY, null)
    setTeamId(null)
    setStatus("signedOut")
  }, [])

  const value = useMemo<AuthValue>(
    () => ({
      status,
      team: teamId ? (TEAM_BY_ID[teamId] ?? null) : null,
      findAccount,
      register,
      signIn,
      signOut,
    }),
    [status, teamId, findAccount, register, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
