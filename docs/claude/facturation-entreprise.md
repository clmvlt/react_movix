# Fiche de facturation de l'entreprise

Detail extrait de CLAUDE.md. A lire avant de modifier ce domaine.

## Contrat API
Informations de facturation de l'entreprise courante (France uniquement), destinees a la
generation future des factures. Seul l'ecran de saisie existe pour l'instant.
Ne pas confondre avec les factures d'abonnement (Movix -> entreprise,
[factures-abonnement.md](factures-abonnement.md)) : la future facturation vivra dans sa propre feature
et ne reutilisera jamais `subscription-invoices`.
- `GET /account/billing` -> 200 `AccountBilling`. Admin seulement (403 sinon). Entreprise =
  header `X-Account-Id`. Fiche jamais enregistree : tous les champs `null`, `updatedAt` null.
- `PUT /account/billing` -> 200 `AccountBilling`. Admin seulement. REMPLACEMENT COMPLET,
  contrairement au PUT partiel historique : un champ absent ou `null` est EFFACE. Toujours
  renvoyer le formulaire entier (`toBillingInput`). Une fiche incomplete est acceptee.
- Champs (tous nullables) : `legalName` (255), `legalForm` (`EI|EURL|SARL|SASU|SAS|SA|SNC|SCOP|
  ASSOCIATION|OTHER`), `shareCapital` (euros, >= 0, 2 decimales), `siret` (14 chiffres, espaces
  acceptes), `rcsCity` (128), `apeCode` (`49.41A` ou `4941A`), `vatNumber` (doit correspondre au
  SIRET), `vatRegime` (`STANDARD|FRANCHISE`), `vatOnDebits` (null = false, interdit en
  FRANCHISE), `defaultVatRate` (20, 10, 8.5, 5.5, 2.1, 0.9, 0 ; en FRANCHISE seul 0 ou null),
  `address1`, `address2`, `postalCode` (5 chiffres), `city`, `email`, `phone` (9 a 15 chiffres,
  `+ . - ( )` et espaces), `iban`, `bic` (8 ou 11), `paymentTermDays` (entier 0..60),
  `latePenaltyRate` (% annuel, 0..100), `earlyPaymentDiscount` (null = "Pas d'escompte pour
  paiement anticipe"), `invoicePrefix` (16, lettres/chiffres/`- _ /`), `invoiceFooter` (1000).
- Reponse = memes champs NORMALISES (SIRET, TVA, IBAN sans espaces, APE `49.41A`, email en
  minuscules) + `siren` (lecture seule), `updatedAt` (ISO avec offset), `complete`,
  `missingFields` (noms des champs obligatoires vides). Apres un PUT reussi, le formulaire
  est remplace par la reponse.
- `missingFields` est calcule par l'API, ne PAS le recoder : toujours legalName, legalForm, siret,
  vatRegime, address1, postalCode, city, email, paymentTermDays, latePenaltyRate ; shareCapital
  si EURL/SARL/SASU/SAS/SA/SCOP ; rcsCity si EURL/SARL/SASU/SAS/SA/SNC/SCOP ; vatNumber et
  defaultVatRate si STANDARD. Les listes `SHARE_CAPITAL_FORMS` / `RCS_FORMS` du front ne servent
  qu'a l'affichage (asterisque).
- Validation -> 400 `{ error: "BILLING_INVALID", message, errors: [{ field, code, message }] }`,
  codes `INVALID_FORMAT`, `INVALID_CHECKSUM`, `SIREN_MISMATCH`, `OUT_OF_RANGE`, `NOT_ALLOWED`,
  `TOO_LONG`. Toutes les erreurs arrivent d'un coup, rien n'est enregistre. Detection
  `ApiError.isBillingInvalid`, erreurs par champ `ApiError.structuredFieldErrors` (le
  `fieldErrors` historique lit le format texte `"<champ> <message>"`, pas celui-ci).

## Front
- API : `accountApi.billing` / `accountApi.updateBilling` (`src/features/account/`), hooks
  `useAccountBilling` et `useUpdateAccountBilling` (ecrit la reponse dans le cache, pas de
  refetch). Types `AccountBilling`, `AccountBillingInput`, constantes `LEGAL_FORMS`,
  `VAT_REGIMES`, `VAT_RATES`.
- UI : onglet "Facturation" des parametres (`?tab=billing`, `adminOnly`), composant autonome
  `src/components/billing/billing-tab.tsx` (comme Tarifs), etat et conversions dans
  `billing-form.ts`, liste deroulante `billing-choice.tsx`. Brouillon non enregistre conserve
  dans le cache (`accountKeys.billingDraft()`) quand on change d'onglet.
- Bandeau d'etat base sur la fiche ENREGISTREE (`complete` / `missingFields`, libelles
  `billing.fields.<champ>`), pas sur la saisie en cours.
- FRANCHISE : taux par defaut et option debits masques et envoyes a `null` / `false`, apercu
  de la mention "TVA non applicable, art. 293 B du CGI".
- Validation client de confort uniquement (SIRET 14 chiffres, code postal 5 chiffres, delai
  entier 0..60, capital >= 0, penalites 0..100) : l'API reste la reference.
- Pre-remplissages : n° de TVA depuis le SIRET (cle = (12 + 3 x (SIREN mod 97)) mod 97 sur 2
  chiffres, `FR` + cle + SIREN, `vatNumberFromSiren`) ; adresse depuis `GET /account/details`.
- L'indemnite forfaitaire de 40 euros pour frais de recouvrement n'est pas un champ : elle sera
  ajoutee automatiquement sur les factures.
