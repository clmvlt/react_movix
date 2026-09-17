# Factures d'abonnement

Detail extrait de CLAUDE.md. A lire avant de modifier ce domaine.

## Perimetre
Factures d'ABONNEMENT : ce que Movix facture a l'entreprise pour l'usage du logiciel (PDF deposes
par l'hyperadmin). Ce n'est PAS la facturation des entreprises a leurs propres clients : celle-ci
vivra dans une feature separee (fiche emetteur deja en place, voir
[facturation-entreprise.md](facturation-entreprise.md)) et ne reutilisera jamais
`subscription-invoices`. Dans le code, "invoice" / "facture" seul est reserve a cette future
feature : tout ce qui concerne l'abonnement porte `subscription` / "d'abonnement".

## Contrat API
Ancien systeme `/factures` renomme cote API, les anciennes routes ne repondent plus.
- `GET /subscription-invoices` (admin) : liste de l'entreprise courante (`X-Account-Id`).
- `GET /subscription-invoices/{id}/pdf` (admin) : PDF. Attention a l'ordre, l'ancien chemin etait
  `/factures/pdf/{id}`.
- `POST /subscription-invoices`, `PUT /subscription-invoices/{id}`, `DELETE /subscription-invoices/{id}`,
  `GET /subscription-invoices/account/{accountId}` : hyperadmin.
- Corps et reponses : `id`, `pdfUrl` (pointe vers `/subscription-invoices/{id}/pdf`), `dateFacture`,
  `montantTTC`, `isPaid`, `createdAt`, `accountId`. Les noms de champs JSON `dateFacture` /
  `montantTTC` n'ont pas change : les garder tels quels.
- Les deux lectures admin repondent 401 quand le profil n'a pas d'entreprise (cas d'autorisation,
  pas de session expiree) : `handleUnauthorized: false` sur ces appels, 401 mappe sur
  `subscriptionInvoices.errors.noAccount`.
- Notifications : type `SUBSCRIPTION_INVOICE` (champs `type` et `relatedEntityType`), titre
  "Nouvelle facture d'abonnement disponible". `FACTURE` n'existe plus (migre en base), ne pas le
  gerer. Le lien de la notification ouvre la liste `/app/subscription-invoices` (pas d'id requis).
- Dashboard : `attention.unpaidSubscriptionInvoices` `{ count, amountTTC }`, null pour un non-admin.
- Apercu de suppression d'entreprise (hyperadmin) : compteur `subscriptionInvoices`.

## Front
- Feature `src/features/subscription-invoices/` : `subscriptionInvoicesApi` (admin),
  `hyperSubscriptionInvoicesApi`, `subscriptionInvoiceKeys`, hooks `useSubscriptionInvoices`,
  `useAccountSubscriptionInvoices`, `useCreate/Update/DeleteSubscriptionInvoice`.
- Composants `src/components/subscription-invoices/`, hyperadmin
  `hyper-subscription-invoices-panel.tsx` (`?tab=subscription-invoices`) et
  `hyper-subscription-invoice-form-dialog.tsx`.
- Page `subscription-invoices-page.tsx`, route `/app/subscription-invoices` (filtres `?paid=`,
  `?from=`, `?to=`). `/app/factures` redirige vers la nouvelle route en conservant la query
  (favoris, anciens liens).
- i18n : namespaces `subscriptionInvoices.*` et `hyperadmin.subscriptionInvoices.*`, libelles
  "Factures d'abonnement" / "Subscription invoices".
- Les PDF s'ouvrent dans l'apercu partage (`usePdfPreview`), jamais en telechargement direct.
