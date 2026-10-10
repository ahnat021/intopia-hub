"use client"

import type { ReactNode } from "react"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { HubProvider } from "@/lib/hub-store"

/** Hub state lives at the root so it survives client navigation between the hub and /admin. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <HubProvider>
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
      </HubProvider>
      <Toaster position="bottom-right" richColors closeButton />
    </ThemeProvider>
  )
}
