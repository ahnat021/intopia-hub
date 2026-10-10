import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft, Scale } from "lucide-react"
import { SiteFooter } from "@/components/site-footer"
import { ThemeToggle } from "@/components/theme-toggle"

export interface LegalSection {
  heading: string
  body: ReactNode
}

export function LegalPage({ title, effective, intro, sections }: { title: string; effective: string; intro: ReactNode; sections: LegalSection[] }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden />
            Back to Intopia Hub
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
          <Scale className="size-4" aria-hidden />
          Legal · Ontario, Canada
        </div>
        <h1 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Effective date: {effective}</p>

        <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm leading-relaxed text-pretty">{intro}</div>

        <nav aria-label="Sections" className="mt-8 rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contents</p>
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

        <p className="mt-12 border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground">
          This document is provided as boilerplate for an educational simulation prototype and does not constitute legal advice. Organizations deploying
          Intopia Hub should have it reviewed by counsel licensed in Ontario.
        </p>
      </main>
      <SiteFooter />
    </div>
  )
}
