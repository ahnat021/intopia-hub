import Link from "next/link"
import { ShieldCheck } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background/70 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="flex items-center gap-2 text-pretty">
          <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden />
          Intopia Hub facilitates simulated B2B agreements only — no real-world financial liability. Governed by the laws of Ontario, Canada.
        </p>
        <nav aria-label="Legal" className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-foreground hover:underline">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-foreground hover:underline">Terms of Service</Link>
          <Link href="/admin" className="hover:text-foreground hover:underline">Admin</Link>
        </nav>
      </div>
    </footer>
  )
}
