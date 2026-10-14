"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft, Scale } from "lucide-react"
import { SiteFooter } from "@/components/site-footer"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { useI18n, type Locale } from "@/lib/i18n"

export interface LegalSection {
  heading: string
  body: ReactNode
}

export interface LegalContent {
  title: string
  effective: string
  intro: ReactNode
  sections: LegalSection[]
}

const CHROME: Record<Locale, { back: string; legal: string; effective: string; author: string; contents: string; toggle: string }> = {
  en: {
    back: "Back to Intopia Hub",
    legal: "Legal · Ontario, Canada",
    effective: "Effective date",
    author: "Author & Administrator",
    contents: "Contents",
    toggle: "Switch to French",
  },
  fr: {
    back: "Retour à Intopia Hub",
    legal: "Juridique · Ontario, Canada",
    effective: "Date d’entrée en vigueur",
    author: "Auteur et administrateur",
    contents: "Table des matières",
    toggle: "Passer à l’anglais",
  },
}

export function LegalPage({ content }: { content: Record<Locale, LegalContent> }) {
  const { locale, toggle } = useI18n()
  const { title, effective, intro, sections } = content[locale]
  const c = CHROME[locale]

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden />
            {c.back}
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={toggle} aria-label={c.toggle} className="font-mono text-xs">
              <span className={locale === "en" ? "text-primary" : "text-muted-foreground"}>EN</span>
              <span className="text-muted-foreground" aria-hidden>
                /
              </span>
              <span className={locale === "fr" ? "text-primary" : "text-muted-foreground"}>FR</span>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main lang={locale} className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
          <Scale className="size-4" aria-hidden />
          {c.legal}
        </div>
        <h1 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {c.effective}: {effective} · {c.author}: Alexander Hnatovsky ·{" "}
          <a href="mailto:ahnat021@uottawa.ca" className="hover:text-foreground hover:underline">
            ahnat021@uottawa.ca
          </a>
        </p>

        <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm leading-relaxed text-pretty">{intro}</div>

        <nav aria-label={c.contents} className="mt-8 rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c.contents}</p>
          <ol className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
            {sections.map((s, i) => (
              <li key={s.heading}>
                <a href={`#s${i + 1}`} className="text-muted-foreground hover:text-foreground hover:underline">
                  {i + 1}. {s.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-8 flex flex-col gap-8">
          {sections.map((s, i) => (
            <section key={s.heading} id={`s${i + 1}`} className="scroll-mt-20">
              <h2 className="text-lg font-semibold">
                {i + 1}. {s.heading}
              </h2>
              <div className="mt-2 flex flex-col gap-3 text-sm leading-relaxed text-muted-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
                {s.body}
              </div>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
