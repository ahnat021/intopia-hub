import { HubHeader } from "@/components/dashboard/hub-header"
import { HubDashboard } from "@/components/dashboard/hub-dashboard"

export default function Page() {
  return (
    <div className="min-h-dvh">
      <HubHeader />
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <HubDashboard />
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Intopia Hub · Simulated market data for training purposes
      </footer>
    </div>
  )
}
