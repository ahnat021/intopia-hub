"use client"

import { Clock, Scale, Server, ShieldCheck, type LucideIcon } from "lucide-react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n, type MessageKey } from "@/lib/i18n"

const BENEFITS: { icon: LucideIcon; title: MessageKey; body: MessageKey }[] = [
  { icon: ShieldCheck, title: "benefits.privacy.title", body: "benefits.privacy.body" },
  { icon: Server, title: "benefits.uptime.title", body: "benefits.uptime.body" },
  { icon: Clock, title: "benefits.time.title", body: "benefits.time.body" },
  { icon: Scale, title: "benefits.neutral.title", body: "benefits.neutral.body" },
]

export function BenefitsSection() {
  const { t } = useI18n()
  return (
    <section aria-labelledby="benefits-title" className="relative flex w-full max-w-4xl flex-col gap-4">
      <h2 id="benefits-title" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {t("benefits.heading")}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map(({ icon: Icon, title, body }) => (
          <li key={title} className="flex">
            <Card className="w-full gap-0 bg-card/95 py-5 backdrop-blur">
              <CardHeader className="gap-3 px-5">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <CardTitle className="text-base leading-snug">{t(title)}</CardTitle>
                <CardDescription className="text-pretty text-sm leading-relaxed">{t(body)}</CardDescription>
              </CardHeader>
            </Card>
          </li>
        ))}
      </ul>
    </section>
  )
}
