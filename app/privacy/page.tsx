import type { Metadata } from "next"
import { LegalPage, type LegalSection } from "@/components/legal/legal-page"

export const metadata: Metadata = {
  title: "Privacy Policy — Intopia Hub",
  description: "How Intopia Hub collects, uses and protects participant information under Ontario and Canadian privacy law.",
}

const sections: LegalSection[] = [
  {
    heading: "Who we are",
    body: (
      <p>
        Intopia Hub (the &quot;Hub&quot;, &quot;we&quot;, &quot;us&quot;) is an educational B2B communication and contract platform operated in support of the
        Intopia business simulation. The Hub is administered from the Province of Ontario, Canada. This Privacy Policy explains how we collect, use,
        disclose and safeguard personal information in accordance with the <strong>Personal Information Protection and Electronic Documents Act</strong>{" "}
        (PIPEDA) and, where an Ontario public institution administers the simulation, the <strong>Freedom of Information and Protection of Privacy Act</strong>{" "}
        (FIPPA).
      </p>
    ),
  },
  {
    heading: "Information we collect",
    body: (
      <>
        <p>We collect only what is necessary to run the simulation marketplace:</p>
        <ul>
          <li><strong>Team identifiers</strong> — team number, simulated company name and operating area.</li>
          <li><strong>Contact details you choose to share</strong> — a WhatsApp number and email address used for coordination between teams.</li>
          <li><strong>Simulation activity</strong> — listings, structured proposals, market research offers, contract terms, signatures and partner ratings.</li>
          <li><strong>Technical data</strong> — basic device and session information required to keep you signed in and to secure the service.</li>
        </ul>
        <p>We do not collect payment card details, government identifiers or real-world banking information. All monetary values in the Hub are simulated.</p>
      </>
    ),
  },
  {
    heading: "How we use information",
    body: (
      <ul>
        <li>To operate the marketplace, structured negotiations and digital contract workflow.</li>
        <li>To display public sportsmanship ratings and leaderboards derived from simulated trades.</li>
        <li>To allow simulation administrators to moderate conduct, resolve disputes and enforce the Terms of Service.</li>
        <li>To maintain the security and integrity of the platform.</li>
      </ul>
    ),
  },
  {
    heading: "Consent",
    body: (
      <p>
        By registering a team and using the Hub you consent to the collection and use of your information for the purposes described above. You may withdraw
        consent at any time by contacting the simulation administrator; doing so may prevent your team from participating in marketplace activity.
      </p>
    ),
  },
  {
    heading: "Disclosure",
    body: (
      <p>
        Contact details are shared only with teams you actively negotiate with. Ratings, team names and completed-deal counts are visible to all participants.
        We do not sell or rent personal information. We may disclose information if required by law, including a valid order from a court or tribunal of
        competent jurisdiction in Ontario.
      </p>
    ),
  },
  {
    heading: "How we protect your data",
    body: (
      <p>
        <strong>Your data is protected.</strong> We apply administrative, technical and physical safeguards appropriate to the sensitivity of the information,
        including encrypted transport (TLS), role-based administrator access and data minimization. Free-text messaging is intentionally disabled in favour of
        structured forms to reduce the collection of unnecessary personal information.
      </p>
    ),
  },
  {
    heading: "Retention",
    body: (
      <p>
        Simulation records are retained only for the duration of the course or competition and a reasonable period afterward for academic review, after which
        they are securely deleted or anonymized.
      </p>
    ),
  },
  {
    heading: "Your rights",
    body: (
      <p>
        You may request access to, or correction of, the personal information we hold about you. If you are not satisfied with our response, you may contact the{" "}
        <strong>Office of the Privacy Commissioner of Canada</strong> or, where FIPPA applies, the <strong>Information and Privacy Commissioner of Ontario</strong>.
      </p>
    ),
  },
  {
    heading: "Contact",
    body: <p>Questions about this policy may be directed to the simulation administrator at privacy@intopia.trade.</p>,
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      effective="October 1, 2026"
      intro={
        <>
          <strong>Summary:</strong> Intopia Hub collects the minimum information needed to run a simulated B2B marketplace. Your data is protected, never sold,
          and the platform facilitates <strong>simulated agreements only</strong> — no real-world financial liability arises from activity on the Hub.
        </>
      }
      sections={sections}
    />
  )
}
