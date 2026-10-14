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

const sectionsFr: LegalSection[] = [
  {
    heading: "Nature du service et lieu neutre",
    body: (
      <>
        <p>
          Intopia Hub est exploitée strictement en tant que plateforme logicielle tierce et indépendante, conçue pour offrir une chambre de compensation
          numérique, une infrastructure de gestion des contrats et une interface de communication pour la simulation Intopia du cours ADM 4711.
        </p>
        <p>
          La Plateforme agit uniquement comme un lieu numérique neutre. Nous ne sommes pas partie aux ententes, contrats ou négociations conclus entre les
          utilisateurs, et nous n&apos;en sommes pas responsables. L&apos;Administrateur n&apos;a aucune obligation de vérifier l&apos;exactitude des annonces
          des utilisateurs ni les intentions des contreparties. Intopia Hub ne saurait être tenue responsable des contrats en défaut, des obligations non
          remplies, du capital de simulation perdu ou de toute incidence négative sur votre dossier scolaire découlant d&apos;actions posées ou omises sur
          cette plateforme.
        </p>
      </>
    ),
  },
  {
    heading: "Monnaie virtuelle",
    body: (
      <p>
        La Plateforme perçoit des « frais de compensation et de protection » sur les transactions facilitées par son architecture. Tous les frais, fonds et
        valeurs transactionnelles traités sur Intopia Hub sont <strong>strictement limités à une monnaie virtuelle simulée, propre au jeu</strong> et associée à
        la simulation pédagogique. Intopia Hub ne traite, ne manipule et ne facilite à aucun moment l&apos;échange de monnaie réelle.
      </p>
    ),
  },
  {
    heading: "Propriété intellectuelle et droit d’auteur",
    body: (
      <>
        <p>
          L&apos;ensemble de la plateforme Intopia Hub, y compris son code source, ses algorithmes, son interface utilisateur et sa conception architecturale,
          constitue un programme d&apos;ordinateur original et une œuvre littéraire au sens de la <em>Loi sur le droit d&apos;auteur</em> du Canada (L.R.C.
          1985, ch. C-42). <strong>Alexander Hnatovsky</strong> en est l&apos;unique auteur et le propriétaire absolu.
        </p>
        <p>
          Il vous est strictement interdit de copier, d&apos;extraire, de rétroconcevoir ou de décompiler toute composante de la Plateforme, ou d&apos;en créer
          des œuvres dérivées. Aucune partie de ce logiciel ne peut être utilisée dans un autre projet sans le consentement préalable, explicite et écrit de
          l&apos;Auteur.
        </p>
      </>
    ),
  },
  {
    heading: "Licence sur le contenu des utilisateurs",
    body: (
      <p>
        En téléversant des documents, des études de marché ou du contenu numérique au moyen des fonctions de clavardage ou d&apos;annonces de la Plateforme,
        vous conservez tous les droits de propriété sur votre contenu. Vous accordez toutefois à la Plateforme une licence temporaire et libre de redevances
        pour héberger, stocker et afficher ce contenu, exclusivement afin de faciliter vos communications avec vos contreparties.
      </p>
    ),
  },
  {
    heading: "Modération et accès",
    body: (
      <p>
        L&apos;utilisation d&apos;Intopia Hub est un privilège révocable. L&apos;Administrateur conserve l&apos;entière et absolue discrétion de suspendre, de
        restreindre ou de résilier définitivement l&apos;accès de tout utilisateur ou de toute équipe à la Plateforme, en tout temps, pour quelque raison que
        ce soit, sans préavis.
      </p>
    ),
  },
  {
    heading: "Exonération de garanties",
    body: (
      <p className="uppercase">
        La Plateforme est fournie « telle quelle » et « selon sa disponibilité ». L&apos;Administrateur décline toute garantie, expresse ou implicite, y compris
        les garanties implicites de qualité marchande et de fonctionnement sans erreur. Vous acceptez expressément que votre utilisation de la Plateforme se
        fait à vos seuls risques.
      </p>
    ),
  },
  {
    heading: "Droit applicable et compétence",
    body: (
      <p>
        La présente entente, ainsi que tout litige découlant de votre utilisation de la Plateforme, est régie et interprétée exclusivement selon les lois de la{" "}
        <strong>province de l&apos;Ontario</strong> et les lois fédérales du Canada qui s&apos;y appliquent.
      </p>
    ),
  },
]

export default function TermsPage() {
  return (
    <LegalPage
      content={{
        en: {
          title: "Terms of Service & End User License Agreement",
          effective: "October 14, 2026",
          intro: (
            <>
              By accessing, registering for, or utilizing the Intopia Hub platform (&quot;the Platform&quot;), you acknowledge that you have read, understood,
              and agree to be bound unconditionally by the terms set forth in this document.
            </>
          ),
          sections,
        },
        fr: {
          title: "Conditions d’utilisation et contrat de licence d’utilisateur final",
          effective: "14 octobre 2026",
          intro: (
            <>
              En accédant à la plateforme Intopia Hub (« la Plateforme »), en vous y inscrivant ou en l&apos;utilisant, vous reconnaissez avoir lu et compris
              les conditions énoncées dans le présent document et acceptez d&apos;y être lié sans condition.
            </>
          ),
          sections: sectionsFr,
        },
      }}
    />
  )
}
