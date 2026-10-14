import type { Metadata } from "next"
import { LegalPage, type LegalSection } from "@/components/legal/legal-page"

export const metadata: Metadata = {
  title: "Terms of Service — Intopia Hub",
  description: "Terms of Service and End User License Agreement for the Intopia Hub platform, governed by the laws of Ontario, Canada.",
}

const sections: LegalSection[] = [
  {
    heading: "Nature of the Service & Neutral Venue",
    body: (
      <>
        <p>
          Intopia Hub operates strictly as an independent, third-party software platform designed to provide a digital clearinghouse, contract management
          infrastructure, and communication interface for the ADM 4711 Intopia simulation.
        </p>
        <p>
          The Platform functions solely as a neutral digital venue. We are not a party to, nor are we responsible for, any agreements, contracts, or negotiations
          formed between users. The Administrator undertakes no obligation to verify the accuracy of user listings or the intent of counterparties. Intopia Hub
          shall not be held liable for defaulted contracts, unfulfilled obligations, lost simulation capital, or any negative impacts on your academic standing
          resulting from actions taken or omitted on this platform.
        </p>
      </>
    ),
  },
  {
    heading: "Virtual Currency",
    body: (
      <p>
        The Platform assesses a designated &quot;Clearing &amp; Protection Fee&quot; on transactions facilitated through its architecture. All fees, funds, and
        transactional values processed on Intopia Hub are <strong>strictly limited to simulated, in-game virtual currency</strong> associated with the academic
        simulation. At no point does Intopia Hub process, handle, or facilitate the exchange of real-world fiat currency.
      </p>
    ),
  },
  {
    heading: "Intellectual Property & Copyright",
    body: (
      <>
        <p>
          The entirety of the Intopia Hub platform, including its source code, algorithms, user interface, and architectural design, constitutes an original
          computer program and literary work under the <em>Copyright Act of Canada</em> (R.S.C., 1985, c. C-42). <strong>Alexander Hnatovsky</strong> is the sole
          author and absolute owner.
        </p>
        <p>
          You are strictly prohibited from copying, scraping, reverse-engineering, decompiling, or creating derivative works based upon any component of the
          Platform. No portion of this software may be utilized in any other project without the prior, explicit, and written consent of the Author.
        </p>
      </>
    ),
  },
  {
    heading: "User Content Licensing",
    body: (
      <p>
        By uploading documents, market research, or digital content through the Platform&apos;s chat or listing features, you retain all original ownership
        rights to your content. However, you grant the Platform a temporary, royalty-free license to host, store, and display said content exclusively for the
        purpose of facilitating your communications with counterparties.
      </p>
    ),
  },
  {
    heading: "Moderation & Access",
    body: (
      <p>
        Utilization of Intopia Hub is a revocable privilege. The Administrator retains the absolute, unfettered discretion to suspend, restrict, or permanently
        terminate any user&apos;s or team&apos;s access to the Platform at any time, for any reason, without prior notice.
      </p>
    ),
  },
  {
    heading: "Disclaimer of Warranties",
    body: (
      <p className="uppercase">
        The Platform is provided on an &quot;as is&quot; and &quot;as available&quot; basis. The Administrator disclaims all warranties, express or implied,
        including implied warranties of merchantability and error-free operation. You expressly agree that your use of the Platform is at your sole risk.
      </p>
    ),
  },
  {
    heading: "Governing Law & Jurisdiction",
    body: (
      <p>
        This agreement, and any dispute arising out of your use of the Platform, shall be governed by and construed exclusively in accordance with the laws of
        the <strong>Province of Ontario</strong> and the federal laws of Canada applicable therein.
      </p>
    ),
  },
]

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service & End User License Agreement"
      effective="October 14, 2026"
      intro={
        <>
          By accessing, registering for, or utilizing the Intopia Hub platform (&quot;the Platform&quot;), you acknowledge that you have read, understood, and
          agree to be bound unconditionally by the terms set forth in this document.
        </>
      }
      sections={sections}
    />
  )
}
