"use client"

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react"
import { useHub } from "@/lib/hub-store"
import * as authActions from "@/lib/actions/auth-actions"
import type { Team } from "@/lib/domain"
import type { ActionResult } from "@/lib/hub-types"

type AuthStatus = "loading" | "signedOut" | "signedIn"

interface AuthValue {
  status: AuthStatus
  team: Team | null
  isAdmin: boolean
  isRegistered: (teamId: string) => boolean
  register: (input: authActions.RegisterInput) => Promise<ActionResult>
  signIn: (teamId: string, pin: string) => Promise<ActionResult>
  adminSignIn: (email: string, password: string) => Promise<ActionResult>
  completeAdminSetup: (email: string, code: string, password: string) => Promise<ActionResult>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { viewer, teamById, loading, refresh } = useHub()

  const withRefresh = useCallback(
    async (p: Promise<ActionResult>) => {
      try {
        const result = await p
        if (result.ok) await refresh()
        return result
      } catch {
        return { ok: false, error: "Network error. Please try again." } as ActionResult
      }
    },
    [refresh],
  )

  const value = useMemo<AuthValue>(() => {
    const team = viewer?.role === "team" ? (teamById[viewer.teamId] ?? null) : null
    return {
      status: loading ? "loading" : team ? "signedIn" : "signedOut",
      team,
      isAdmin: viewer?.role === "admin",
      isRegistered: (id) => (teamById[id]?.kyc ?? "unregistered") !== "unregistered",
      register: (input) => withRefresh(authActions.registerTeam(input)),
      signIn: (id, pin) => withRefresh(authActions.signInTeam(id, pin)),
      adminSignIn: (email, password) => withRefresh(authActions.adminSignIn(email, password)),
      completeAdminSetup: (email, code, password) => withRefresh(authActions.completeAdminSetup(email, code, password)),
      signOut: async () => {
        await authActions.signOut()
        await refresh()
      },
    }
  }, [loading, refresh, teamById, viewer, withRefresh])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
