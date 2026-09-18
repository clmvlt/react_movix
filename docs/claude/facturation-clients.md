# Facturation des clients (factures, avoirs)

Detail extrait de CLAUDE.md. A lire avant de modifier ce domaine.

## Perimetre
Les entreprises facturent leurs propres clients (grossistes, laboratoires, pharmacies) a partir de
leurs tournees ou commandes, ou en saisie libre. Rien a voir avec `features/subscription-invoices`
(abonnement Movix, voir [factures-abonnement.md](factures-abonnement.md)). Prerequis : la fiche
emetteur `/account/billing` ([facturation-entreprise.md](facturation-entreprise.md)).
Toutes les routes sont admin (403 sinon) et scopees sur `X-Account-Id`.

REGLE : une facture emise ne se modifie ni ne se supprime. On l'annule par un avoir
(`POST /invoices/{id}/credit-note`). Seul un brouillon (`DRAFT`) se modifie ou se supprime.

## Erreurs
- Metier : `{ error: CODE, message, ...details }`. Router sur `error` (`ApiError.errorCode`),
  libelles dans `invoices.errors.codes.<CODE>` (hook `useInvoiceError`).
- Champs : 400 `{ error, message, errors: [{ field, code, message }] }`, lues par
  `ApiError.structuredFieldErrors`. `field` peut viser une ligne : `lines[2].quantity`.
- Details lus par `invoiceErrorMissingFields`, `invoiceErrorCustomerId`, `invoiceErrorCommands`.

## Qui est facture : la cascade (REGLE CRITIQUE)
Le client facture se resout cote SERVEUR, du plus precis au plus general :

```
customerId passe explicitement a la generation
  -> sinon : donneur d'ordre DE LA COMMANDE (command.orderer)
       -> sinon : donneur d'ordre DE SA TOURNEE (tour.client)
            -> sinon : destinataire de la commande
```

Consequence : poser un donneur d'ordre sur la tournee suffit a facturer toute la tournee a ce
client, sans renseigner chaque commande ; et une commande qui porte deja son propre donneur d'ordre
n'est PAS ecrasee par celui de sa tournee. Voir [tournees.md](tournees.md) pour le champ `client`
d'une tournee, d'une config automatique et d'un token d'import.

400 `CUSTOMER_REQUIRED` reste leve des que le resultat est ambigu (par exemple deux tournees avec
deux donneurs d'ordre differents dans la meme facture) : `InvoiceGenerateDialog` passe alors le
champ Client en obligatoire.

**Ne JAMAIS rejouer cette cascade cote front** pour afficher un apercu du client facture : ce serait
dupliquer une regle metier serveur, et le front n'a de toute facon pas les `orderer` de chaque
commande depuis le dialog (il ne recoit que des ids). Le dialog se contente d'expliquer la cascade
en texte (`invoices.generate.customerOptional`). Un vrai apercu demanderait un endpoint serveur.

## Clients factures
Le client facture est un client du referentiel unique `/clients` (`src/features/clients/`), type
`GENERIC` ou `PHARMACY` : `/billing/customers` n'existe plus. Routes, corps, erreurs et
formulaire : [clients.md](clients.md).

## Factures `/invoices` (`src/features/invoices/`)
- `GET ?status&type&customerId&from&to&commandId&tourId&page&size` -> `{ items, total, page, size }`
  (plus recent d'abord). `from`/`to` = date d'emission (exclut les brouillons). `tourId` /
  `commandId` = factures ayant facture cette tournee / commande (badge `InvoicedBadges`).
  `customerId` = id d'un client `/clients`, pharmacie comprise.
- `GET /{id}` -> `Invoice` : resume + `customer` et `seller` FIGES, `creditedInvoiceId/Number`
  (avoir), `creditNoteId/Number` (facture annulee), periode, `notes`, `totalVat`,
  `vatBreakdown`, `lines`, `commands`.
- `POST /generate` `{ tourIds | commandIds (exactement l'un), customerId?, lineMode? }` -> 201
  `{ invoice, excludedCommands, unpricedCommands }`. DETAILED (defaut) = une ligne par commande,
  GROUPED = une ligne par tranche. Sans `customerId`, si toutes les commandes vont au meme client,
  c'est lui qui est facture (aucune fiche creee a la volee) ; sinon 400 `CUSTOMER_REQUIRED` et le
  dialogue passe le client en obligatoire puis relance. 409
  `COMMAND_ALREADY_INVOICED` (+`commands`), `NOTHING_TO_INVOICE` ; 404 `TOUR_NOT_FOUND` /
  `COMMAND_NOT_FOUND`. Appel lent (distances) : timeout 120 s et chargement dedie.
  `excludedCommands` / `unpricedCommands` sont memorises dans `invoiceKeys.generation(id)` et
  affiches en tete du brouillon ouvert apres generation.
- `POST` `{ customerId }` -> brouillon vide. `PUT /{id}` (brouillon) REMPLACEMENT COMPLET des
  lignes : `{ customerId*, serviceStartDate, serviceEndDate, notes (2000), lines: [{ description*
  (500), quantity* > 0 (3 dec.), unitPriceHt* (2 dec., negatif = remise), vatRate (null = taux
  entreprise) }] }`. Les commandes rattachees ne changent pas (pour en retirer : supprimer le
  brouillon et regenerer). 409 `INVOICE_NOT_DRAFT`.
- `DELETE /{id}` (brouillon) -> 204, commandes de nouveau facturables.
- `POST /{id}/issue` -> numero, date du jour, echeance. Irreversible (confirmation explicite).
  409 `INVOICE_EMPTY`, `INVOICE_NEGATIVE_TOTAL`, `BILLING_INFO_INCOMPLETE` (+`missingFields` de
  `/account/billing`, lien `/app/settings?tab=billing`), `CUSTOMER_INFO_INCOMPLETE`
  (+`customerId`, `missingFields` : ouvre l'edition du client via `/clients/{id}`),
  `VAT_NOT_APPLICABLE` (franchise
  en base avec une ligne a TVA non nulle). Affichage : `InvoiceProblemAlert`.
- `POST /{id}/payment` `{ paidAt? }` (entre emission et aujourd'hui) -> PAID, 409
  `INVOICE_NOT_ISSUED` ; `DELETE /{id}/payment` -> ISSUED, 409 `INVOICE_NOT_PAID`.
- `POST /{id}/credit-note` `{ reason? (500) }` -> 201 avoir emis (CREDIT_NOTE, montants
  negatifs), la facture passe CANCELLED et ses commandes redeviennent facturables. 409
  `CREDIT_NOTE_NOT_ALLOWED`, `BILLING_INFO_INCOMPLETE`.
- `GET /{id}/pdf` : via `usePdfPreview`, brouillon marque BROUILLON par l'API.

## Montants
Nombres JSON en euros, formates `formatEuro` (fr-FR). Ne JAMAIS recalculer les totaux d'une
facture : afficher ceux de l'API (TVA calculee par taux sur la base HT cumulee). Seul l'editeur de
brouillon affiche des totaux indicatifs pendant la saisie (`indicativeTotals`), remplaces par
ceux de la reponse au PUT.

## Front
- Cache : chaque mutation ecrit la facture renvoyee dans `invoiceKeys.detail`, purge ses PDF et
  invalide `invoiceKeys.lists()` (liste, badges tournee / commande). Idem clients.
- Pages (nav "Facturation", admin) : `/app/invoices` (filtres statut, type, client, periode,
  page dans l'URL ; filtres repliables sous `lg`), `/app/invoices/:id` (actions selon statut),
  `/app/invoices/:id/edit` (editeur de brouillon). Les clients vivent sur `/app/clients`
  (`?type=&q=&page=`, voir [clients.md](clients.md)) ; `/app/billing-customers` y redirige.
- Statuts affiches (`invoiceDisplayStatus`) : Brouillon, Emise, En retard (`overdue`), Payee,
  Annulee, Avoir (`type = CREDIT_NOTE`).
- Points d'entree "Facturer" (`InvoiceGenerateDialog`) : `CommandActions` (selection de
  commandes : expeditions, tournees), fiche commande, en-tete et menu contextuel d'une tournee,
  onglet Export > Tournees (selection multiple de tournees).
- Editeur : TVA des nouvelles lignes = taux par defaut de `/account/billing` (0 en franchise),
  reordonnancement par boutons monter / descendre (pas de glisser-deposer).
- Apercu de suppression d'entreprise : compteur `invoices` (factures et avoirs emis), distinct
  de `subscriptionInvoices`.
