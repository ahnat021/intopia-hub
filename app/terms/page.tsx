import type { Metadata } from "next"
import { LegalPage, type LegalSection } from "@/components/legal/legal-page"

export const metadata: Metadata = {
  title: "Terms of Service — Intopia Hub",
  description: "Terms governing use of the Intopia Hub simulated B2B marketplace, governed by the laws of Ontario, Canada.",
}

const sections: LegalSection[] = [
  {
    heading: "Acceptance of terms",
    body: (
      <p>
        These Terms of Service (the &quot;Terms&quot;) govern access to and use of Intopia Hub (the &quot;Hub&quot;). By registering a team or using the Hub, you
        agree to be bound by these Terms. If you do not agree, do not use the Hub.
      </p>
    ),
  },
  {
    heading: "Nature of the service",
    body: (
      <>
        <p>
          The Hub is an <strong>educational simulation tool</strong>. It provides marketplace listings, structured negotiation forms, market research sharing and
          digital contract records between teams participating in the Intopia business simulation.
        </p>
        <p>
          The Hub is strictly a communication and contract record platform. Production, sales office, capital transfer and other internal simulation mechanics are
          performed in the simulation itself, not in the Hub.
        </p>
      </>
    ),
  },
  {
    heading: "Simulated agreements — no financial liability",
    body: (
      <>
        <p>
          <strong>All agreements, contracts, prices, loans, licenses and payments recorded on the Hub are simulated.</strong> They do not create legally
          enforceable obligations, do not involve real currency, and give rise to <strong>no real-world financial liability</strong> for any participant, team,
          institution or the operator.
        </p>
        <p>
          A &quot;finalized&quot; contract on the Hub represents a commitment within the simulation only and is not a contract within the meaning of the laws of
          Ontario or Canada.
        </p>
      </>
    ),
  },
  {
    heading: "Eligibility and accounts",
    body: (
      <ul>
        <li>Teams must be registered participants of an authorized Intopia simulation.</li>
        <li>You are responsible for keeping your team PIN confidential and for all activity under your team.</li>
        <li>Teams whose consolidated simulated equity falls below zero are automatically locked out (bankruptcy).</li>
      </ul>
    ),
  },
  {
    heading: "Acceptable use",
    body: (
      <>
        <p>To protect participants, free-text chat is disabled and all negotiation occurs through standardized forms. You agree not to:</p>
        <ul>
          <li>Misrepresent your team, inventory or capacity in a way that breaches the simulation rules.</li>
          <li>Harass, threaten or discriminate against other participants through any linked channel.</li>
          <li>Attempt to access another team&apos;s account or interfere with the Hub&apos;s operation.</li>
          <li>Use the Hub for any real-world commercial, financial or unlawful purpose.</li>
        </ul>
      </>
    ),
  },
  {
    heading: "Moderation and administrator powers",
    body: (
      <p>
        Simulation administrators may, at their discretion and without notice, suspend or remove a team&apos;s access, and may override, approve or delete any
        contract record to preserve the fairness and integrity of the simulation.
      </p>
    ),
  },
  {
    heading: "Ratings",
    body: (
      <p>
        Post-trade ratings reflect participants&apos; opinions of simulated conduct. Ratings must be honest and relate only to sportsmanship within the
        simulation. Administrators may remove ratings that are abusive or manipulative.
      </p>
    ),
  },
  {
    heading: "Disclaimer and limitation of liability",
    body: (
      <p>
        The Hub is provided &quot;as is&quot; and &quot;as available&quot;. To the maximum extent permitted by applicable law, the operator disclaims all warranties
        and shall not be liable for any indirect, incidental or consequential damages, including any academic outcome, arising from use of the Hub. Nothing in
        these Terms limits rights that cannot be limited under the <strong>Consumer Protection Act, 2002</strong> (Ontario).
      </p>
    ),
  },
  {
    heading: "Privacy",
    body: <p>Use of the Hub is also governed by our Privacy Policy, which describes how participant information is collected and protected.</p>,
  },
  {
    heading: "Governing law and jurisdiction",
    body: (
      <p>
        These Terms are governed by the laws of the <strong>Province of Ontario</strong> and the federal laws of Canada applicable therein. Any dispute shall be
        subject to the exclusive jurisdiction of the courts located in Ontario.
      </p>
    ),
  },
  {
    heading: "Changes",
    body: <p>We may update these Terms from time to time. Continued use of the Hub after changes are posted constitutes acceptance of the revised Terms.</p>,
  },
]

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      effective="October 1, 2026"
      intro={
        <>
          <strong>Summary:</strong> Intopia Hub is a learning tool. Every trade, loan and contract on it is <strong>simulated</strong> and carries{" "}
          <strong>no real-world legal or financial liability</strong>. These Terms are governed by the laws of Ontario, Canada.
        </>
      }
      sections={sections}
    />
  )
}
