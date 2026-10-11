"use client"

import { useState, useSyncExternalStore, type ReactNode } from "react"
import Image from "next/image"
import { Check, Copy, Heart } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

const DONATION_EMAIL = "alexander.hnatovsky@gmail.com"
const SEEN_KEY = "intopia:donation-seen"

type Step = "ask" | "sad" | "thanks"

const subscribe = () => () => {}
const readSeen = () => sessionStorage.getItem(SEEN_KEY) === "1"

export function DonationGate({ children }: { children: ReactNode }) {
  const alreadySeen = useSyncExternalStore(subscribe, readSeen, () => false)
  const [dismissed, setDismissed] = useState(false)
  const [step, setStep] = useState<Step>("ask")
  const [copied, setCopied] = useState(false)

  if (alreadySeen || dismissed) return <>{children}</>

  const finish = () => {
    sessionStorage.setItem(SEEN_KEY, "1")
    setDismissed(true)
  }

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(DONATION_EMAIL)
      setCopied(true)
      toast.success("Email copied. Thank you so much!")
    } catch {
      toast.message(DONATION_EMAIL)
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="donation-title"
        className="flex w-full max-w-md flex-col items-center gap-5 rounded-xl border border-border bg-card p-6 text-center text-card-foreground shadow-lg sm:p-8"
      >
        {step === "sad" ? (
          <>
            <Image
              src="/images/sad-cat.jpg"
              alt="A tiny kitten standing on its hind legs with big teary eyes"
              width={200}
              height={258}
              priority
              className="rounded-lg"
            />
            <div className="flex flex-col gap-2">
              <h1 id="donation-title" className="text-balance text-xl font-semibold">
                Are you sure?
              </h1>
              <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                {"No pressure at all, this little one just wanted to ask one more time. Even a small e-transfer helps keep Intopia Hub running for future classes."}
              </p>
            </div>
            <div className="flex w-full flex-col gap-2">
              <Button onClick={() => setStep("thanks")}>
                <Heart aria-hidden="true" />
                {"Okay, I'll help"}
              </Button>
              <Button variant="ghost" onClick={finish}>
                No, take me to the login
              </Button>
            </div>
          </>
        ) : step === "thanks" ? (
          <>
            <Heart aria-hidden="true" className="size-8 text-primary" />
            <div className="flex flex-col gap-2">
              <h1 id="donation-title" className="text-balance text-xl font-semibold">
                Thank you, truly
              </h1>
              <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                Please send your e-transfer to:
              </p>
            </div>
            <button
              type="button"
              onClick={copyEmail}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-muted px-4 py-3 font-mono text-sm text-foreground transition-colors hover:bg-accent"
            >
              {DONATION_EMAIL}
              {copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
              <span className="sr-only">Copy email address</span>
            </button>
            <Button className="w-full" onClick={finish}>
              Continue to login
            </Button>
          </>
        ) : (
          <>
            <Heart aria-hidden="true" className="size-8 text-primary" />
            <div className="flex flex-col gap-2">
              <h1 id="donation-title" className="text-balance text-xl font-semibold">
                Help keep Intopia Hub alive
              </h1>
              <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                {"This platform is built and maintained by students in our spare time. Donations are completely optional, but if you're able to, an e-transfer of any amount would really help keep the project alive and well."}
              </p>
              <p className="font-mono text-sm text-foreground">{DONATION_EMAIL}</p>
            </div>
            <div className="flex w-full flex-col gap-2">
              <Button onClick={() => setStep("thanks")}>
                <Heart aria-hidden="true" />
                {"I'd like to donate"}
              </Button>
              <Button variant="ghost" onClick={() => setStep("sad")}>
                No, thank you
              </Button>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
