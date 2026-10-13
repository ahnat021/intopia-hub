"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import type { Listing } from "@/lib/domain"
import { useHub } from "@/lib/hub-store"

export function WithdrawListingButton({ listing }: { listing: Listing }) {
  const { withdrawListing } = useHub()
  const [pending, setPending] = useState(false)
  const negotiating = listing.status === "NEGOTIATING"

  const confirm = async () => {
    setPending(true)
    const ok = await withdrawListing(listing.id)
    setPending(false)
    if (ok) toast.success(negotiating ? "Listing withdrawn and negotiations closed" : "Listing removed")
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" disabled={pending} aria-label={`Withdraw listing: ${listing.title}`} className="text-muted-foreground hover:text-destructive">
          <Trash2 aria-hidden />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Withdraw this listing?</AlertDialogTitle>
          <AlertDialogDescription className="text-pretty">
            {negotiating
              ? "Teams are already negotiating on this listing. Withdrawing closes those negotiations and marks the listing Closed. Their chat history stays visible to them."
              : "No one has responded yet, so the listing will be removed from the marketplace entirely. You can post a corrected one afterwards."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep listing</AlertDialogCancel>
          <AlertDialogAction onClick={() => void confirm()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Withdraw
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
