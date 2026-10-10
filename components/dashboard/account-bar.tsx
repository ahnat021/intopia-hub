import type { ReactNode } from "react"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { teamLabel, type Team } from "@/lib/mock-data"

export function AccountBar({ team, onSignOut, children }: { team: Team; onSignOut: () => void; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 font-mono text-[11px] font-bold text-primary ring-1 ring-inset ring-primary/30">
          {teamLabel(team.id)}
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-medium">{team.name}</p>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden />
            Signed in
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        <Button variant="ghost" size="sm" onClick={onSignOut} className="text-muted-foreground hover:text-foreground">
          <LogOut className="size-4" aria-hidden />
          Log Out
        </Button>
      </div>
    </div>
  )
}
