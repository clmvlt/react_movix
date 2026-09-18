# Clients (referentiel unique : pharmacies et clients factures)

Detail extrait de CLAUDE.md. A lire avant de modifier ce domaine.

## Perimetre
Depuis la migration V24 de l'API, une entreprise a UN seul referentiel de clients, type :
`GENERIC` (grossiste, laboratoire, client libre) ou `PHARMACY` (pharmacie livree). Une pharmacie
EST un client specialise : memes champs communs, plus `cip`, `numero`, `color`,
`doubleCleTransporteur`, `doubleCleExpediteur`. Les identifiants n'ont pas change (une pharmacie a
garde son UUID). `src/features/pharmacies` et les ecrans `/app/pharmacies` n'existent plus : tout
passe par `src/features/clients` et les ecrans `/app/clients`. Contrat complet cote API :
`../api_movix/docs/api/clients.md`.

## Routes `/clients`
Lecture : tout utilisateur connecte. Ecriture (`POST`, `PUT`, `DELETE`, photos, zone) : admin
(403 sinon). Scope `X-Account-Id`.
- `GET /clients?type&search&page&size` -> page de ClientDTO (liste simple, utilisee par le
  selecteur de client des factures).
- `POST /clients/search` -> page mixte GENERIC + PHARMACY. Criteres cumulatifs : `query`
  (multi-mots, 10 max), `type`, `name`, `city`, `postalCode`, `address`, `email`, `cip`, `zoneId`
  (uuid ou `"none"`), `hasPhotos`, `hasOrdered`, `isLocationValid`, `page`, `size` (max 500).
- `GET /clients/{id}` et `GET /clients/by-cip/{cip}` -> ClientDTO avec `pictures`.
- `GET /clients/by-cip/{cip}/exists` -> `{ exists, id }` (controle d'unicite du CIP a la creation).
- `POST /clients` (201), `PUT /clients/{id}` REMPLACEMENT COMPLET, `DELETE /clients/{id}` (204).
- `POST /clients/{id}/label` -> PDF (409 `CLIENT_NOT_A_PHARMACY` pour un GENERIC : le bouton ne
  s'affiche que pour une pharmacie).
- Photos : `POST /clients/{id}/pictures`, `PUT .../pictures/{pictureId}`, `DELETE .../{pictureId}`,
  `PUT .../pictures/order` (ordre complet en UNE requete),
  `POST .../pictures/from-report/{reportPictureId}`.
- `PUT /clients/zone` `{ clientIds, zoneId | null }` -> `{ updated }` : affectation ET detachement
  en masse, tout ou rien, une seule requete (plus de N appels paralleles).

## Corps POST / PUT
Polymorphe sur `type` (absent = `GENERIC`), construit par `buildClientInput`
(`src/components/clients/client-form.ts`).
- Communs : `code`, `name`, `firstName`, `lastName`, `address1`, `address2`, `address3`,
  `postalCode`, `city`, `country`, `latitude`, `longitude`, `quality`, `phone`, `fax`, `email`,
  `informations` (consigne chauffeur), `commentaire` (note interne), `deliveryWindowStart` /
  `deliveryWindowEnd` (`HH:mm`), `zoneId`, `siret`, `vatNumber`, `billingAddress`.
- `code` = identifiant externe du client chez l'entreprise (ex. `MEZEGEL`), unique par entreprise,
  modifiable, nullable, en lecture et en ecriture. C'est par lui que l'import reconnait un donneur
  d'ordre. Affiche sur la fiche (carte Identite) et dans les resultats du selecteur de client.
  ATTENTION : `POST /clients/search` n'expose PAS de critere `code` et la recherche libre `query`
  n'est documentee que sur nom, CIP, ville, code postal et adresse - ne pas inventer de critere,
  ce serait un 400 `UNKNOWN_FIELD`.
- `type = PHARMACY` seulement : `cip`, `numero`, `color`, `doubleCleTransporteur`,
  `doubleCleExpediteur`.
- NE JAMAIS envoyer un champ hors de cette liste : 400 `UNKNOWN_FIELD` est un BUG DU FRONT. Pas de
  `cip` sur un GENERIC, pas de champ en lecture seule invente. Le type ne change jamais apres
  creation (400 `CLIENT_TYPE_MISMATCH`), le formulaire le fige en edition.
- `name` obligatoire en GENERIC, `cip` obligatoire et unique par entreprise en PHARMACY. Code
  postal a 5 chiffres si le pays est vide ou France. SIRET et TVA FR verifies (cle et SIREN).
- Le PUT remplacant toute la fiche, le formulaire conserve et renvoie AUSSI les champs qu'il
  n'edite pas (`latitude`, `longitude`, `quality`) : sinon une modification effacerait la position.
  Il n'y a plus de mise a jour partielle comme l'ancien `PUT /pharmacies/{cip}`.
- `billingAddress` (`name`, `address1`, `address2`, `postalCode`, `city`, `country`, `email`) =
  adresse de facturation quand elle differe de l'adresse de livraison. Tous champs vides = `null`.
  Sur la facture, son nom et son email remplacent ceux du client, et si elle porte une adresse,
  celle-ci remplace ENTIEREMENT l'adresse principale.

## Reponse ClientDTO
Les memes champs plus `id`, `type`, `neverOrdered`, `zone {id, name}`, `missingFields` (mentions
manquantes pour facturer), `createdAt`, `updatedAt`, et `pictures` seulement sur le detail
(`GET /clients/{id}`, `GET /clients/by-cip/{cip}`). Photo : `{ id, name, displayOrder, mimeType,
originalName, createdAt, imagePath }`.

## Erreurs
Toujours `{ error, message }` (`ApiError.errorCode`, libelles `invoices.errors.codes.<CODE>`).
- 400 `CLIENT_INVALID` + `errors: [{ field, code, message }]` lues par
  `ApiError.structuredFieldErrors`. `field` peut etre imbrique (`billingAddress.postalCode`) : le
  formulaire indexe ses erreurs sur ces memes cles et ouvre la section repliee si besoin.
  Codes : `REQUIRED`, `TOO_LONG`, `INVALID_FORMAT`, `INVALID_CHECKSUM`, `SIREN_MISMATCH`,
  `OUT_OF_RANGE`, `NOT_FOUND`, `UNKNOWN`, `UNKNOWN_FIELD`.
- 400 `UNKNOWN_FIELD`, 400 `CLIENT_TYPE_MISMATCH`, 400 `CLIENT_TYPE_UNKNOWN`,
  404 `CLIENT_NOT_FOUND`, 409 `PHARMACY_CIP_ALREADY_USED`, 409 `CLIENT_HAS_INVOICES`,
  409 `CLIENT_NOT_A_PHARMACY` (etiquette), 404 `ZONE_NOT_FOUND` et 404 `CLIENT_NOT_FOUND` +
  `missingIds` (zone en masse), 400 `CLIENT_PICTURE_INVALID`, 404 `CLIENT_PICTURE_NOT_FOUND`,
  400 `CLIENT_PICTURE_ORDER_INVALID` + `missingIds` / `unknownIds`,
  404 `CLIENT_REPORT_PICTURE_NOT_FOUND`, 500 `CLIENT_PICTURE_STORAGE_FAILED`.

## Front
- `src/features/clients/` : `useClients` (liste simple), `useClientSearch` (recherche complete),
  `useClient`, `useClientByCip`, `useCreateClient`, `useUpdateClient`, `useDeleteClient`, photos
  (`useAddClientPicture`, `useUpdateClientPicture`, `useUploadClientPictures`,
  `useReorderClientPictures`, `useDeleteClientPicture`, `useTransferReportPicture`) et
  `useAssignClientsToZone`. Chaque mutation ecrit la fiche renvoyee dans `clientKeys.detail` et
  invalide `clientKeys.lists()` / `clientKeys.searches()`.
- Ecrans :
  - `/app/clients` : recherche et filtres complets (`?mode=&type=&q=&n=&city=&cp=&cip=&adr=&mail=`
    `&zone=&photos=1&ordered=1&geo=invalid&size=&page=`, ecriture en `replace`), tableau
    `ClientTable`, pagination serveur, etiquette PDF et suppression dans le menu de ligne.
  - `/app/clients/:id` : fiche en lecture, `?edit=1` bascule en edition (push d'historique, retour
    navigateur = retour en lecture), `?focus=position` entre en edition sur la recherche d'adresse.
    Sections `ClientSections` : Identite, Adresse, Position (carte sticky au `lg`, localisation
    depuis l'adresse, moyenne des dernieres livraisons), Livraison, Contact, Facturation, Note,
    Photos. Plus les cartes Commandes recentes et Etiquette.
  - `/app/clients/new` : creation, choix du type en tete (`?type=PHARMACY`), controle d'unicite du
    CIP avant envoi. Admin seulement.
  - `/app/clients/by-cip/:cip` : resolveur pour les liens qui ne connaissent qu'un CIP (commande,
    tournee, expedition, anomalie). Il redirige vers la fiche par `id`.
- Les champs pharmacie (CIP, numero et couleur de cle, doubles cles, code-barres, etiquette)
  n'apparaissent QUE pour un client `PHARMACY` : c'est la seule difference entre les deux vues.
- Etat de formulaire : `useClientForm` (`src/components/clients/use-client-form.ts`) : `set`,
  `patch`, `setBilling`, `setWindow`, `setPosition(position, source)`, `applyAddress(result)`,
  `dirty` derive de la comparaison du `ClientInput` complet, `validate()` (focus sur le premier
  champ en erreur via `clientFieldId`), `applyApiError` (erreurs `errors[]` imbriquees comprises,
  plus `PHARMACY_CIP_ALREADY_USED` sur le champ CIP). `<FormSaveBar>` et `useDiscardGuard`.
- `ClientFormDialog` reste le formulaire COURT (creation rapide depuis le selecteur de facture,
  correction d'un client incomplet). La fiche complete est la page, pas le dialogue.
- Selecteur unique `ClientPicker` (tous types) : filtre des factures, editeur de brouillon,
  creation de commande et dialogue d'anomalie. `clientOption()` fabrique l'option affichee.
- Photos : `ClientPhotoGallery` + uploader, lightbox et editeur d'annotations
  (`src/components/clients/client-photo-*.tsx`), reordonnancement en une requete.
- Composants partages sortis du domaine : `src/components/zone-select.tsx`,
  `delivery-window-fields.tsx`, `key-color-input.tsx`, `key-tag.tsx`, `place-map.tsx`, plus les
  helpers `src/lib/address-form.ts` et `src/lib/command-points.ts`.
- Suppression proposee pour un client `GENERIC` (menu de la liste, bouton de la fiche) ; une
  pharmacie se supprime aussi par `DELETE /clients/{id}` mais l'action n'est pas exposee.

## Zones
`PUT /clients/zone` porte l'affectation et le detachement en masse (`ZoneAssignMenu`), la liste
d'une zone vient de `GET /zones/{id}/clients` (`useZoneClients`), et `GET /zones/map` renvoie tous
les clients : chaque point porte `id` et `type`, `cip` est null pour un GENERIC. La selection de
`/app/zones` est indexee par `id` de client, plus par CIP. `ZoneDTO.clientCount` remplace
`pharmacyCount`.

## Commandes, tournees, anomalies : un client de tout type
Une commande, une anomalie, un arret de tournee et un rapport terrain visent un client de
n'importe quel type.
- Lecture : `command.client`, `anomalie.client`, `report.client` (`ClientDTO` polymorphe). Le champ
  `pharmacy` existe encore sur ces DTO mais c'est le contrat du MOBILE : il vaut `null` pour un
  client GENERIC et le web ne le lit plus (il a ete retire des types TypeScript). CIP, cle,
  code-barres et etiquette ne s'affichent que si `client.type === "PHARMACY"`
  (`isPharmacyClient`).
- `pharmacyCommentaire`, `pharmacyDeliveryWindowStart/End` restent et valent pour tous les types.
- Creation : `POST /commands` et `POST /anomalies[/generate]` prennent `clientId` (le web l'envoie
  toujours), `cip` restant accepte pour le mobile et l'import. Le selecteur de la page
  `/app/commands/new` et celui du dialogue d'anomalie listent TOUS les types via `ClientPicker`.
- Recherches : `CommandSearchResult` porte `clientId`, `clientType`, `clientCip` ; les filtres
  `clientId` existent sur `/commands/search`, `/commands/souffrance/search`, `/anomalies/search`,
  `/packages/souffrance/search` et les stats. Les ecrans Commandes et Souffrance exposent ce filtre
  par `?client=<id>` dans l'URL.
- Tournees : `TourStop` et `TourDispatchSkipped` portent `clientId`, `clientType`, `clientName` ;
  `pharmacyCip` est null hors pharmacie. L'ordre de passage et la repartition se regroupent par
  client, plus par CIP.
- Stats par client : chaque ligne porte `clientId`, `type`, `cip` (null hors pharmacie). La
  selection de l'onglet Exports est indexee par `clientId`.
- `GET /commands/client/{clientId}/last-commands` (`useClientLastCommands`) alimente la carte
  Commandes recentes et la position moyenne des livraisons.
- Rapports terrain (`/pharmacy-infos`, page `/app/client-reports`) : chaque rapport porte
  `client` ; l'atelier ouvre la fiche client, edite la fiche par `PUT /clients/{id}` et transfere
  une photo par `POST /clients/{id}/pictures/from-report/{pictureId}`.

## Anciennes routes (SUPPRIMEES de l'API, 404)
`POST/PUT /pharmacies`, `/pharmacies/{cip}/picture*`, `GET /pharmacies/exist/{cip}`,
`POST /pharmacies/{cip}/label`, `POST /pharmacies/search`, `GET /pharmacies/{cip}`,
`/pharmacy-picture-transfer/*`, `GET /zones/{id}/pharmacies`, `PUT /zones/assign/{id}`,
`GET /commands/pharmacy/{cip}/last-commands`. Seuls `GET /pharmacies/{cip}` et `POST /pharmacies/search` survivent, pour le MOBILE. Ont aussi
disparu des reponses : `ZoneDTO.pharmacyCount` (lire `clientCount`) et `report.pharmacy` (lire
`report.client`). Cote front, `/app/pharmacies`, `/app/pharmacies/new` et `/app/pharmacies/:cip`
redirigent vers les ecrans clients.

## Factures
- `customerId` (creation, mise a jour, generation, filtres) est un id de client `/clients`, quel
  que soit son type.
- Generation sans `customerId` : si toutes les commandes vont au meme client, c'est lui qui est
  facture ; sinon 400 `CUSTOMER_REQUIRED`.
- Emission refusee 409 `CUSTOMER_INFO_INCOMPLETE` + `missingFields` : `InvoiceProblemAlert` ouvre
  `ClientFormDialog` sur `/clients/{id}`.
