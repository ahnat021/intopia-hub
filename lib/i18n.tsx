"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

export type Locale = "en" | "fr"

const DICT = {
  en: {
    "brand.tagline": "Intopia trading floor",
    "nav.adminPortal": "Admin Portal",
    "lang.switch": "Français",
    "login.select": "Select your team",
    "login.selectHint": "Search the roster by team number or company. New teams complete a one-time verified setup.",
    "login.team": "Team",
    "login.choose": "Choose a team to sign in or complete first-time setup.",
    "login.returning": "Returning team",
    "login.setup": "First-time setup",
    "login.locked": "Locked",
    "login.change": "Change",
    "login.pin": "4-digit team PIN",
    "login.enter": "Enter the Hub",
    "login.stats.teams": "Teams",
    "login.stats.verified": "Verified",
    "login.stats.review": "In review",
    "setup.company": "Company name",
    "setup.region": "Home region",
    "setup.whatsapp": "WhatsApp number",
    "setup.email": "Team contact email",
    "setup.pin": "Set 4-digit PIN",
    "setup.confirm": "Confirm PIN",
    "setup.send": "Email me a verification code",
    "setup.sending": "Sending code...",
    "setup.codeSent": "Code sent to",
    "setup.codeHint": "Enter the 6-digit code from your inbox. It expires in 10 minutes.",
    "setup.code": "6-digit verification code",
    "setup.verify": "Verify & submit for review",
    "setup.edit": "Edit details",
    "setup.resend": "Resend code",
    "setup.review": "New accounts are reviewed by the Hub Administrator (KYC) before trading access is granted.",
    "pending.title": "Verification in progress",
    "pending.body": "Your email is verified. The Hub Administrator is reviewing your registration; this page updates automatically once you're approved.",
    "pending.signOut": "Sign out",
    "db.offline": "The hub database is still connecting. Data will appear as soon as it's available.",
    "operator.badge": "Hub Operator",
    "marquee.label": "Team 25 · Hub Operators",
  },
  fr: {
    "brand.tagline": "Salle des marchés Intopia",
    "nav.adminPortal": "Portail admin",
    "lang.switch": "English",
    "login.select": "Choisissez votre équipe",
    "login.selectHint": "Recherchez par numéro d'équipe ou entreprise. Les nouvelles équipes effectuent une inscription vérifiée unique.",
    "login.team": "Équipe",
    "login.choose": "Choisissez une équipe pour vous connecter ou vous inscrire.",
    "login.returning": "Équipe inscrite",
    "login.setup": "Première inscription",
    "login.locked": "Verrouillée",
    "login.change": "Changer",
    "login.pin": "NIP d'équipe à 4 chiffres",
    "login.enter": "Entrer dans le Hub",
    "login.stats.teams": "Équipes",
    "login.stats.verified": "Vérifiées",
    "login.stats.review": "En revue",
    "setup.company": "Nom de l'entreprise",
    "setup.region": "Région d'origine",
    "setup.whatsapp": "Numéro WhatsApp",
    "setup.email": "Courriel de l'équipe",
    "setup.pin": "Créer un NIP à 4 chiffres",
    "setup.confirm": "Confirmer le NIP",
    "setup.send": "M'envoyer un code de vérification",
    "setup.sending": "Envoi du code...",
    "setup.codeSent": "Code envoyé à",
    "setup.codeHint": "Saisissez le code à 6 chiffres reçu par courriel. Il expire dans 10 minutes.",
    "setup.code": "Code de vérification à 6 chiffres",
    "setup.verify": "Vérifier et soumettre",
    "setup.edit": "Modifier",
    "setup.resend": "Renvoyer le code",
    "setup.review": "Les nouveaux comptes sont vérifiés (KYC) par l'administrateur du Hub avant l'accès aux échanges.",
    "pending.title": "Vérification en cours",
    "pending.body": "Votre courriel est vérifié. L'administrateur examine votre inscription; cette page se mettra à jour automatiquement après l'approbation.",
    "pending.signOut": "Se déconnecter",
    "db.offline": "La base de données du Hub se connecte. Les données apparaîtront dès qu'elles seront disponibles.",
    "operator.badge": "Opérateur du Hub",
    "marquee.label": "Équipe 25 · Opérateurs du Hub",
  },
} as const

export type MessageKey = keyof (typeof DICT)["en"]

interface I18nValue {
  locale: Locale
  setLocale: (l: Locale) => void
  toggle: () => void
  t: (key: MessageKey) => string
}

const STORAGE_KEY = "intopia-hub:locale"
const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === "en" || stored === "fr") setLocaleState(stored)
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    try {
      window.localStorage.setItem(STORAGE_KEY, l)
    } catch {
      // Preference simply won't persist when storage is blocked.
    }
  }, [])

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale,
      toggle: () => setLocale(locale === "en" ? "fr" : "en"),
      t: (key) => DICT[locale][key] ?? DICT.en[key],
    }),
    [locale, setLocale],
  )
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}
