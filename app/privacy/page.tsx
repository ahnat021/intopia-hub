import type { Metadata } from "next"
import { LegalPage, type LegalSection } from "@/components/legal/legal-page"

export const metadata: Metadata = {
  title: "Privacy Policy — Intopia Hub",
  description: "How Intopia Hub collects, protects, and retains participant data. Governed by the laws of Ontario, Canada.",
}

const sections: LegalSection[] = [
  {
    heading: "Data Collection",
    body: (
      <>
        <p>To facilitate the marketplace and communication features of the Platform, we collect the following information:</p>
        <ul>
          <li>
            <strong>Account Data:</strong> Names and official simulation email addresses (<code>ottXX@intopsim.com</code>).
          </li>
          <li>
            <strong>Contact Data:</strong> WhatsApp numbers or other provided communication identifiers.
          </li>
          <li>
            <strong>Usage Data:</strong> Proprietary chat transcripts, uploaded attachments, and transaction listings.
          </li>
        </ul>
      </>
    ),
  },
  {
    heading: "Strict Confidentiality & Academic Separation",
    body: (
      <>
        <p>Intopia Hub operates entirely independently of the University of Ottawa administration and teaching faculty.</p>
        <ul>
          <li>We guarantee strict confidentiality regarding your platform activity.</li>
          <li>
            No negotiations, chat logs, contract drafts, or personal data will be voluntarily disclosed, surrendered, or transmitted to the course professor,
            university administration, or competing student cohorts.
          </li>
        </ul>
      </>
    ),
  },
  {
    heading: "Third-Party Sharing",
    body: (
      <p>
        We <strong>do not sell, rent, or monetize</strong> your personal data. Data is exclusively processed within the application&apos;s secure database
        infrastructure (Supabase) solely to enable real-time chat, authentication, and marketplace functionality.
      </p>
    ),
  },
  {
    heading: "Data Archival & Retention",
    body: (
      <>
        <p>
          Upon the conclusion of the relevant academic semester, all active personal data directly identifying users (including names, contact numbers, and
          profile identifiers) will be systematically scrubbed from the live production environment.
        </p>
        <p>
          However, you explicitly acknowledge and grant the Administrator the right to migrate and permanently store anonymized platform usage metrics,
          structural data, and chat histories within a secure, private archival database. This retention is executed exclusively for the Administrator&apos;s
          personal portfolio development, historical preservation, and future software architecture reference, and shall remain strictly inaccessible to the
          public.
        </p>
      </>
    ),
  },
  {
    heading: "Governing Law & Jurisdiction",
    body: (
      <p>
        This privacy policy, and any dispute arising from our data practices, shall be governed by and construed exclusively in accordance with the laws of the{" "}
        <strong>Province of Ontario</strong> and the federal laws of Canada applicable therein.
      </p>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      effective="October 14, 2026"
      intro={<>By accessing or utilizing the Intopia Hub platform, you consent to the data collection and retention practices outlined in this Privacy Policy.</>}
      sections={sections}
    />
  )
}
