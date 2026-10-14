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

const sectionsFr: LegalSection[] = [
  {
    heading: "Collecte des données",
    body: (
      <>
        <p>Afin de faire fonctionner le marché et les fonctions de communication de la Plateforme, nous recueillons les renseignements suivants :</p>
        <ul>
          <li>
            <strong>Données de compte :</strong> noms et adresses courriel officielles de la simulation (<code>ottXX@intopsim.com</code>).
          </li>
          <li>
            <strong>Coordonnées :</strong> numéros WhatsApp ou autres identifiants de communication fournis.
          </li>
          <li>
            <strong>Données d&apos;utilisation :</strong> transcriptions de clavardage, pièces jointes téléversées et annonces de transactions.
          </li>
        </ul>
      </>
    ),
  },
  {
    heading: "Confidentialité stricte et séparation pédagogique",
    body: (
      <>
        <p>Intopia Hub est exploitée de façon entièrement indépendante de l&apos;administration et du corps professoral de l&apos;Université d&apos;Ottawa.</p>
        <ul>
          <li>Nous garantissons une stricte confidentialité quant à vos activités sur la plateforme.</li>
          <li>
            Aucune négociation, aucun historique de clavardage, aucune ébauche de contrat ni aucune donnée personnelle ne sera volontairement divulgué, remis ou
            transmis au professeur du cours, à l&apos;administration universitaire ou aux cohortes d&apos;étudiants concurrentes.
          </li>
        </ul>
      </>
    ),
  },
  {
    heading: "Communication à des tiers",
    body: (
      <p>
        Nous <strong>ne vendons, ne louons et ne monnayons pas</strong> vos données personnelles. Les données sont traitées exclusivement au sein de
        l&apos;infrastructure de base de données sécurisée de l&apos;application (Supabase), uniquement pour permettre le clavardage en temps réel,
        l&apos;authentification et les fonctions du marché.
      </p>
    ),
  },
  {
    heading: "Archivage et conservation des données",
    body: (
      <>
        <p>
          À la fin du trimestre universitaire concerné, toutes les données personnelles actives permettant d&apos;identifier directement les utilisateurs (y
          compris les noms, numéros de contact et identifiants de profil) seront systématiquement supprimées de l&apos;environnement de production.
        </p>
        <p>
          Vous reconnaissez toutefois expressément et accordez à l&apos;Administrateur le droit de migrer et de conserver de façon permanente des statistiques
          d&apos;utilisation anonymisées, des données structurelles et des historiques de clavardage dans une base de données d&apos;archives privée et
          sécurisée. Cette conservation sert exclusivement au développement du portfolio personnel de l&apos;Administrateur, à la préservation historique et à
          la référence pour de futures architectures logicielles, et demeure strictement inaccessible au public.
        </p>
      </>
    ),
  },
  {
    heading: "Droit applicable et compétence",
    body: (
      <p>
        La présente politique de confidentialité, ainsi que tout litige découlant de nos pratiques en matière de données, est régie et interprétée
        exclusivement selon les lois de la <strong>province de l&apos;Ontario</strong> et les lois fédérales du Canada qui s&apos;y appliquent.
      </p>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <LegalPage
      content={{
        en: {
          title: "Privacy Policy",
          effective: "October 14, 2026",
          intro: <>By accessing or utilizing the Intopia Hub platform, you consent to the data collection and retention practices outlined in this Privacy Policy.</>,
          sections,
        },
        fr: {
          title: "Politique de confidentialité",
          effective: "14 octobre 2026",
          intro: (
            <>
              En accédant à la plateforme Intopia Hub ou en l&apos;utilisant, vous consentez aux pratiques de collecte et de conservation des données décrites
              dans la présente politique de confidentialité.
            </>
          ),
          sections: sectionsFr,
        },
      }}
    />
  )
}
