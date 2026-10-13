import type { Metadata, Viewport } from "next"
import Image from "next/image"
import { Cinzel, Geist, Geist_Mono } from "next/font/google"
import { DonationGate } from "@/components/donation-gate"
import { Providers } from "@/components/providers"
import { BootSplash } from "@/components/boot-splash"
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })
const cinzel = Cinzel({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-cinzel" })

export const metadata: Metadata = {
  title: "Intopia Hub | B2B Marketplace & Contract Hub",
  description:
    "The B2B communication and contract hub for the Intopia simulation: live listings, structured negotiations, digital contracts and sportsmanship ratings.",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#070B14" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`bg-background ${geistSans.variable} ${geistMono.variable} ${cinzel.variable}`}>
      <body className="font-sans">
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <Image src="/images/globe-network.png" alt="" fill priority sizes="100vw" className="hub-backdrop object-cover object-top" />
        </div>
        <Providers>
          <BootSplash />
          <DonationGate>{children}</DonationGate>
        </Providers>
      </body>
    </html>
  )
}
