# Consentement cookies, CGU et pages legales

Detail extrait de CLAUDE.md. A lire avant de modifier ce domaine.

## Consentement cookies, CGU et pages legales
- Consentement : logique hors React dans `src/lib/consent.ts` (cle `movix.consent`,
  `{version, decidedAt, categories:{necessary, google, analytics}}` ; changer `CONSENT_VERSION`
  fait revenir le bandeau), hook `useConsent()` dans `src/hooks/use-consent.ts`
  (`consent`, `hasDecided`, `isAllowed`, `accept`, `openPreferences`). `<ConsentBanner>` est monte
  dans `App.tsx` a cote de `<UpdateBanner>` et porte aussi le dialog de preferences (ouvert depuis
  le pied de page landing, `/app/settings` et le bouton Google grise). Le bandeau est centre en bas
  au-dessus d'un voile sombre (`bg-black/50`). Pas de croix ni de fermeture
  exterieure : `DialogContent hideClose` + `onInteractOutside` / `onEscapeKeyDown` annules.
- Google : `loadGoogleIdentity()` rejette (`GoogleIdentityBlockedError`) tant que
  `isConsentAllowed("google")` est faux ; `<GoogleAuthButton>` affiche alors un bouton grise avec le
  lien "Modifier". Retirer le consentement apres chargement ne decharge pas le script (jusqu'au
  prochain rechargement). Prop `gate` = overlay + `inert` qui bloque le bouton GIS tant que la case
  CGU de `/register` n'est pas cochee.
- CGU : `POST /auth/register` envoie `acceptedTerms: true` (case obligatoire, erreur de champ
  `acceptedTerms`, 400 `TERMS_NOT_ACCEPTED` -> `ApiError.isTermsNotAccepted`) ; `POST /auth/login/google`
  porte `acceptedTerms` en option. Bloc `terms` OPTIONNEL sur `ProfilAuth`
  (`{accepted, acceptedAt, acceptedVersion, currentVersion}`) : absent = aucune barriere.
  `<TermsGate>` (`src/components/auth/terms-gate.tsx`) est rendu par `ProtectedRoute` (donc
  uniquement sous `/app` et sur l'ecran sans entreprise), seulement si `terms.accepted === false` ET
  `isEmailVerified !== false` (verification d'email d'abord). `POST /auth/accept-terms`
  (`useAcceptTerms`, corps vide) puis invalidation de `auth.me`.
- Pages legales publiques `/legal/terms`, `/legal/privacy`, `/legal/cookies`
  (`src/pages/legal/*`, rendu par `src/components/legal/legal-document.tsx`, liens partages dans
  `legal-links.ts`). Le contenu est un texte de travail en FRANCAIS uniquement dans
  `src/content/legal/fr.ts` (placeholders `[À COMPLÉTER]` mis en evidence) : c'est l'exception voulue a la regle i18n, l'anglais viendra
  dans un `en.ts` du meme format. Ne jamais inventer de mentions legales (SIREN, adresse, DPO).
  La page cookies doit rester alignee sur l'inventaire reel des cles `movix.*` et du cookie
  `auth_token`.
