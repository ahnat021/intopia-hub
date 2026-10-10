import type { Metadata, Viewport } from "next"
import Image from "next/image"
import { Geist, Geist_Mono } from "next/font/google"
import { Providers } from "@/components/providers"
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  title: "Intopia Hub — B2B Marketplace & Contract Hub",
  description:
    "The B2B communication and contract hub for the Intopia simulation: live listings, structured negotiations, digital contracts and sportsmanship ratings.",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1324" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`bg-background ${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans">
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <Image src="/images/globe-network.png" alt="" fill priority sizes="100vw" className="hub-backdrop object-cover object-top" />
        </div>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
