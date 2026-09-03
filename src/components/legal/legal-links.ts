export interface LegalLink {
  to: string;
  labelKey: string;
}

export const LEGAL_LINKS: LegalLink[] = [
  { to: "/legal/terms", labelKey: "legal.nav.terms" },
  { to: "/legal/privacy", labelKey: "legal.nav.privacy" },
  { to: "/legal/cookies", labelKey: "legal.nav.cookies" },
];
