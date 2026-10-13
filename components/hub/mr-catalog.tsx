"use client"

import { useState } from "react"
import { Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MR_CATALOG, MR_CATEGORIES, type MrCatalogItem, type MrCategory } from "@/lib/constants"
import { formatCompactUSD } from "@/lib/intopia-rules"

export function MrCatalog({ onSyndicate, disabled }: { onSyndicate: (item: MrCatalogItem) => void; disabled?: boolean }) {
  const [cat, setCat] = useState<MrCategory | "ALL">("ALL")
  const items = cat === "ALL" ? MR_CATALOG : MR_CATALOG.filter((i) => i.category === cat)
  return (
    <section aria-labelledby="mr-title" className="glass-card flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="mr-title" className="font-serif text-lg">
          37-Item Market Research Syndication
        </h3>
        <Tabs value={cat} onValueChange={(v) => setCat(v as MrCategory | "ALL")}>
          <TabsList>
            <TabsTrigger value="ALL">All</TabsTrigger>
            {MR_CATEGORIES.map((c) => (
              <TabsTrigger key={c} value={c}>
                {c}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <ul className="grid max-h-96 gap-2 overflow-y-auto sm:grid-cols-2">
        {items.map((i) => (
          <li key={i.id} className="flex items-start justify-between gap-3 rounded-md border border-border p-3 text-sm">
            <div className="min-w-0">
              <p className="font-medium leading-snug">
                <span className="font-mono text-muted-foreground">#{i.id}</span> {i.title}
              </p>
              <p className="text-xs italic text-muted-foreground">{i.titleFr}</p>
              <p className="mt-1 font-mono text-xs">
                {formatCompactUSD(i.costUSD)} · {i.category}
              </p>
            </div>
            <Button size="sm" variant="outline" disabled={disabled} onClick={() => onSyndicate(i)} aria-label={`Offer cost-splitting on ${i.title}`}>
              <Share2 aria-hidden /> Split
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
