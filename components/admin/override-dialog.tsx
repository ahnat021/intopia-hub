"use client"

import { useEffect, useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { ContractOverride } from "@/lib/hub-store"
import type { Contract } from "@/lib/mock-data"
import { formatUSD } from "@/lib/intopia-rules"

type Fields = Record<keyof ContractOverride, string>

const toFields = (c: Contract): Fields => ({
  quantity: String(c.quantity),
  unitPrice: String(c.unitPrice),
  totalValue: String(c.totalValue),
  cashPct: String(c.cashPct),
  ar1Pct: String(c.ar1Pct),
  ar2Pct: String(c.ar2Pct),
})

export function OverrideDialog({
  contract,
  onClose,
  onSave,
}: {
  contract: Contract | null
  onClose: () => void
  onSave: (id: string, patch: ContractOverride) => void
}) {
  const [fields, setFields] = useState<Fields | null>(null)

  useEffect(() => {
    setFields(contract ? toFields(contract) : null)
  }, [contract])

  const isSale = contract?.kind === "PRODUCT_SALE"
  const n = (k: keyof Fields) => Number(fields?.[k] ?? 0)
  const total = isSale ? Math.round(n("quantity") * 1000 * n("unitPrice")) : n("totalValue")
  const termsSum = n("cashPct") + n("ar1Pct") + n("ar2Pct")
  const invalid =
    !fields ||
    termsSum !== 100 ||
    [n("cashPct"), n("ar1Pct"), n("ar2Pct")].some((v) => v < 0) ||
    (isSale ? n("quantity") <= 0 || n("unitPrice") <= 0 : n("totalValue") <= 0)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!contract || invalid) return
    onSave(contract.id, {
      quantity: n("quantity"),
      unitPrice: n("unitPrice"),
      totalValue: total,
      cashPct: n("cashPct"),
      ar1Pct: n("ar1Pct"),
      ar2Pct: n("ar2Pct"),
    })
  }

  const field = (key: keyof Fields, label: string, step = "any") => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`ov-${key}`} className="text-xs">{label}</Label>
      <Input
        id={`ov-${key}`}
        type="number"
        inputMode="decimal"
        step={step}
        min={0}
        value={fields?.[key] ?? ""}
        onChange={(e) => setFields((f) => (f ? { ...f, [key]: e.target.value } : f))}
        className="font-mono"
      />
    </div>
  )

  return (
    <Dialog open={!!contract} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>Override {contract?.id}</DialogTitle>
            <DialogDescription>Edited terms are applied immediately and flagged as an administrator override for both teams.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            {isSale ? (
              <>
                {field("quantity", "Quantity (K units)")}
                {field("unitPrice", "Unit price ($)")}
              </>
            ) : (
              <div className="col-span-2">{field("totalValue", contract?.kind === "B2B_LOAN" ? "Principal ($)" : "License fee ($)", "1")}</div>
            )}
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-xs font-medium">Payment terms (%)</legend>
            <div className="grid grid-cols-3 gap-3">
              {field("cashPct", "Cash", "1")}
              {field("ar1Pct", "AR 1 period", "1")}
              {field("ar2Pct", "AR 2 periods", "1")}
            </div>
            <p className={termsSum === 100 ? "text-xs text-muted-foreground" : "text-xs text-destructive"} aria-live="polite">
              {termsSum === 100 ? "Terms sum to 100%." : `Terms must sum to 100% (currently ${termsSum}%).`}
            </p>
          </fieldset>

          <div className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2 text-sm">
            <span className="text-muted-foreground">New total value</span>
            <span className="font-mono font-semibold">{formatUSD(total)}</span>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={invalid}>Apply override</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
