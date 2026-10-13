"use client"

import { useState } from "react"
import { Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MR_CATALOG, MR_CATEGORIES, MR_CATEGORY_LABEL, type MrCatalogItem, type MrCategory } from "@/lib/constants"
import { formatCompactUSD } from "@/lib/intopia-rules"

export function MrCatalog({ onSyndicate, disabled }: { onSyndicate: (item: MrCatalogItem) => void; disabled?: boolean }) {
  const [cat, setCat] = useState<MrCategory | "ALL">("ALL")
  const sections = cat === "ALL" ? MR_CATEGORIES : [cat]
  return (
    <section aria-labelledby="mr-title" className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="mr-title" className="text-lg font-semibold">
          Market Research Syndication · 35 tools
        </h3>
        <Tabs value={cat} onValueChange={(v) => setCat(v as MrCategory | "ALL")}>
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="ALL">All</TabsTrigger>
            {MR_CATEGORIES.map((c) => (
              <TabsTrigger key={c} value={c}>
                {c}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <div className="flex max-h-[28rem] flex-col gap-4 overflow-y-auto">
        {sections.map((section, idx) => {
          const items = MR_CATALOG.filter((i) => i.category === section)
          return (
            <div key={section} className="flex flex-col gap-2">
              <h4 className="text-sm font-semibold text-muted-foreground">
                Section {MR_CATEGORIES.indexOf(section) + 1 || idx + 1}: {MR_CATEGORY_LABEL[section]} ({items.length} tools)
              </h4>
              <ul className="grid gap-2 sm:grid-cols-2">
                {items.map((i) => (
                  <li key={i.id} className="flex items-start justify-between gap-3 rounded-md border border-border p-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium leading-snug">
                        <span className="font-mono text-muted-foreground">#{i.id}</span> {i.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{i.titleFr}</p>
                      <p className="mt-1 font-mono text-xs">${i.costUSD.toLocaleString("en-CA")}</p>
                    </div>
                    <Button size="sm" variant="outline" disabled={disabled} onClick={() => onSyndicate(i)} aria-label={`Offer cost-splitting on ${i.title}`}>
                      <Share2 aria-hidden /> Split
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}
