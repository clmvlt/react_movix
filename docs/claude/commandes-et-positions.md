# Page commande (et regles de position heritees des pharmacies)

Detail extrait de CLAUDE.md. A lire avant de modifier ce domaine.

## Les pharmacies sont des clients
Depuis la migration V24, une pharmacie est un client de type `PHARMACY` du referentiel `/clients` :
il n'y a plus de domaine `features/pharmacies` ni d'ecran `/app/pharmacies` cote web. Fiche,
creation, recherche, photos, etiquette, zones : tout est decrit dans [clients.md](clients.md).
Ce fichier ne garde que ce qui reste vrai pour les commandes.

## Les trois roles d'une commande (API V25)
Une commande ne vise plus un client unique mais trois roles, presents sur `CommandDTO`,
`CommandBasicDTO` et `CommandDetailDTO` (types `CommandParty` dans `src/features/commands/types.ts`) :
- **`orderer`** : le donneur d'ordre, celui qui commande la course et **celui qu'on facture**.
  Toujours un `ClientDTO` du referentiel, **`null` sur toutes les commandes anterieures a V25** :
  prevoir l'etat vide, il est frequent.
- **`sender`** : le lieu de chargement, `null` quand l'entreprise expedie depuis son depot.
- **`recipient`** : le lieu de livraison, l'unique arret de la commande.

`sender` et `recipient` sont des `CommandPartyDTO` qui portent **toujours** l'identite et l'adresse a
afficher, que la partie soit reliee au referentiel ou saisie sur la commande. **Le front ne fait
AUCUNE resolution** : on affiche `recipient.name`, `recipient.address1`... jamais
`party.client?.name ?? party.name`. `linked` sert uniquement a decider si l'on propose le lien de
fiche client et si l'on affiche le CIP et le type (`clientType`, `cip`).

Une partie "libre" ne porte que nom, adresse, contact et GPS : pas de zone, pas de creneau, pas de
consignes, pas de photos, pas de CIP - ce sont des attributs du referentiel, pas d'une ligne de
commande. Ne jamais proposer ces champs dans un formulaire libre.

`command.client` est **DEPRECIE** : c'est le destinataire uniquement quand il est relie, `null`
sinon. Ne plus s'en servir pour afficher un nom (il sera retire comme l'a ete `pharmacy`) ; il ne
reste utile que pour les consignes du referentiel (zone, creneau, commentaire de livraison), qu'un
destinataire libre n'a pas. Helpers de lecture dans `src/features/commands/commands.parties.ts`
(`partyLabel`, `partyAddressLines`, `commandRecipient` - ce dernier retombe sur `client` uniquement
pour les commandes anterieures a V25).

## Creation : `POST /commands` exige `ordererId`
Sans `ordererId`, l'API repond 400 `ORDERER_REQUIRED`. Corps :
`{ expedition_date, ordererId, sender?, recipient?, command: { num_transport, packages } }`.
`sender` et `recipient` se remplissent **de l'une des deux facons, jamais des deux** : relie
(`clientId`, ou `cip` pour une pharmacie) ou libre (`name` obligatoire, `firstName`, `lastName`,
`address1..3`, `postalCode`, `city`, `country`, `phone`, `email`, `latitude`, `longitude`).
`clientId` / `cip` a la racine restent acceptes comme destinataire (ancien contrat) mais **jamais en
meme temps que `recipient`** : le front envoie toujours `recipient`.

Erreurs, format `{ error, message, role }` (`ApiError.errorCode` / `ApiError.errorRole`) :
`ORDERER_REQUIRED` (400), `PARTY_AMBIGUOUS` (400, role donne relie ET libre), `PARTY_INCOMPLETE`
(400, partie libre sans `name`), `PARTY_CLIENT_NOT_FOUND` (404). `buildCreateBody`
(`commands.api.ts`) refuse deja localement une partie ambigue ou incomplete.

L'UI de creation (`src/pages/command-create-page.tsx`) : donneur d'ordre en popup obligatoire (pas de
saisie libre), expediteur et destinataire en deux modes exclusifs via `<ViewSwitch>` ("Client
existant" / "Saisie libre", `CommandPartyField`). Basculer de mode ou choisir un client **vide**
l'autre source : l'UI ne doit jamais pouvoir produire un `PARTY_AMBIGUOUS`. Le choix d'un client
relie passe pour les trois roles par le MEME composant, `<ClientSearchDialog>`
(`src/components/clients/client-search-dialog.tsx`, `POST /clients/search` debounce + pagination),
enveloppe par `<ClientSelectField>`.

## Identite et position (REGLE CRITIQUE)
- Ne jamais lire `pharmacy` sur un DTO de commande, d'anomalie ou de rapport : ce champ est le
  contrat du mobile et vaut `null` pour un client GENERIC. CIP, cle et etiquette seulement si
  `clientType === "PHARMACY"`.
- **`id` (UUID) est l'identite STABLE** d'une pharmacie comme de tout client : cle React, cle de
  cache, identite de ligne, cle de selection. Le `cip` est une donnee metier MODIFIABLE, unique par
  entreprise seulement : ce n'est jamais un identifiant persistant. Les ecrans qui ne connaissent
  qu'un CIP (commande, tournee, expedition, anomalie) passent par `/app/clients/by-cip/:cip`, qui
  resout l'id et redirige.
- L'API renvoie la position dans `latitude` / `longitude` : afficher ce champ tel quel, ne jamais
  reconstruire une position a partir d'une autre source.
- `command.latitude` / `command.longitude` sont la position de LIVRAISON de la commande, pas celle
  de la pharmacie. Pour un trajet, un tri ou un marqueur d'arret, utiliser toujours la position de
  la pharmacie (`stop.latitude` / `stop.longitude` des reponses trajet). Symptome typique d'une
  confusion des deux : un arret dont `previousLeg` vaut ~0 km.
- Une pharmacie n'existe que pour un compte : tout cache indexe par CIP doit tomber au changement
  d'entreprise. C'est le cas par construction, `dropDataCache()` (`auth-context.tsx`) supprime
  toutes les queries dont la racine n'est pas `auth` a chaque `applySelection`.
- Ne jamais envoyer `accountId` dans le corps d'un POST / PUT client (retire du contrat).

## Page commande (fiche)
Page `/app/commands/:id` (`src/pages/command-detail-page.tsx`), meme ossature que la fiche client :
`PageHeader` (badge statut + creneau dans `titleExtra`, sous-titre "Commande du <date>"), puis
`<CommandSections>` (`src/components/commands/command-sections.tsx`) en deux etages.

Etage 1, pleine largeur, `<CommandParties>` : le donneur d'ordre en bandeau (avec "Ouvrir la fiche
client" et "Commandes de ce donneur d'ordre" -> `/app/commands?orderer=<id>`), puis expediteur a
gauche et destinataire a droite (`lg:grid-cols-2`, meme gabarit, empiles sur mobile avec l'expediteur
en premier). Chaque partie porte un badge "Du referentiel" / "Propre a la commande" : une partie libre
n'est pas modifiable depuis une fiche client et n'a ni zone ni creneau.

Etage 2 : grille `lg:grid-cols-3` avec six cartes `SectionCard` en colonne principale (Expedition,
Statut, Commentaire, Colis, Photos, Dernieres commandes) et la carte Livraison en colonne droite
sticky (`lg:col-start-3 lg:row-span-6`, `<CommandDeliveryCard>`). Ne jamais omettre une carte
principale conditionnellement : le `row-span-6` en depend (le tarif est une ligne de la carte
Expedition, pas une carte).

### La carte de la page commande
UNE seule carte pour toute la page, `<CommandMap>` (`src/components/commands/command-map.tsx`, chargee
en `lazy`), dans la `SectionCard` "Carte". Elle porte QUATRE points plus le depot, et c'est tout
l'interet de l'ecran : l'ecart entre le theorique et le releve. Les coordonnees ne sont JAMAIS
reaffichees en texte (ni sur les cartes de parties, ni sous les preuves) : la carte les montre, seul
l'ecart en metres est ecrit.
- Adresse de l'expediteur (`sender.latitude/longitude`), grande epingle, icone camion.
- Adresse de livraison (`recipient.latitude/longitude`), grande epingle, icone colis.
- Chargement REELLEMENT releve (`loading.latitude/longitude`), petite epingle, icone coche.
- Livraison REELLEMENT relevee (`delivery.latitude/longitude`), petite epingle, icone coche.
- Le depot de l'entreprise via `<DepotMarker>`.

Couleur PAR ROLE, taille et icone par nature : expediteur et chargement partagent
`commandMapColors.sender`, destinataire et livraison `commandMapColors.recipient`
(`src/lib/colors.ts`, jamais de hex en dur dans le composant). Un `<MapRoute>` relie chaque adresse a
son point releve, ce qui rend l'ecart visible d'un coup d'oeil ; ces `MapRoute` portent une `key`
derivee des coordonnees car leur effet ne se redeclenche que sur le NOMBRE de points. Chaque point
present a sa puce dans la legende sous la carte. `<MapAutoFit>` cadre sur les points existants. Si
aucun des quatre points n'existe, etat vide (la carte n'est pas montee) avec le raccourci "Definir la
position" quand le destinataire est relie a une fiche client.
- Preuves de passage : `CommandDetailDTO.loading` et `.delivery`, chacun `null` tant que l'etape n'a
  pas eu lieu (`at`, `latitude`, `longitude`, `signatureName`, `signatureAt`, `signatureImageUrl`).
  L'ecart en metres entre le releve et l'adresse est calcule par `distanceMeters` (`src/lib/geo.ts`,
  vol d'oiseau, pur affichage : ce n'est pas un calcul d'itineraire). `signatureImageUrl` est une URL
  directe affichable dans un `<img>` (`dark:invert` pour rester lisible en theme sombre). Prevoir un
  passage date sans signature ni position, le mobile ne transmet pas toujours les deux.
- Pas de mode edition global : chaque information a son action dans sa carte. Date d'expedition ->
  `CommandExpDateDialog` (prop `currentExpDate` : date preremplie, "Date actuelle", Enregistrer inactif
  sans changement) ; commentaire -> `CommandCommentDialog` (`""` = effacement) ; statut ->
  `CommandStatusDialog` ; scan force -> `SwitchRow` a mutation immediate ; tarif visible par tous,
  Modifier reserve a l'admin. Date et commentaire ne partagent JAMAIS un dialog.
- Historique de statut en ligne dans la carte Statut (`StatusTimeline` + `useCommandHistory`), pas de
  modale. Photos via `<PictureGrid>`. En-tete : seulement Anomalie et Souffrance (ou Restaurer).
- "Voir la tournee" aligne d'abord la date de travail sur `expDate` (`useWorkingDate().setDate`) avant
  `navigate("/app/tours?tour=<id>")` : la page Tournees remplace un `?tour=` inconnu par la premiere
  tournee du jour affiche.
- `closeDate` n'est PAS une date de livraison (champ d'import) : libelle "Date de cloture", information
  secondaire. L'heure de passage reelle est `status.createdAt` (visible dans l'historique).
- `SectionCard` vit dans `src/components/section-card.tsx` (re-exporte par `client-fields.tsx`),
  `coarsePointer()` dans `src/lib/pointer.ts`.

## Recherche et perimetre inchange
- `POST /commands/search` accepte `ordererId` (UUID, filtre exact, cumulable). La page Commandes le
  lit dans l'URL (`?orderer=<id>`, comme `?client=<id>` pour le destinataire) ; il n'a pas de champ
  dans `<SearchFilters>` mais "Effacer" le retire. Les criteres existants (`pharmacyName`,
  `pharmacyCity`, `pharmacyCip`, `clientId`...) portent toujours sur le DESTINATAIRE.
- La recherche libre (`query`) ne balaie PAS encore le donneur d'ordre ni l'expediteur : ne pas
  promettre cette fonction dans l'UI.
- Tournees, itineraire, optimisation, repartition et ETA : AUCUN changement. Une commande reste un
  seul arret, positionne sur le destinataire ; l'expediteur n'est pas un point d'enlevement a
  desservir. Le tarif reste la distance depot de l'entreprise -> destinataire.
- `CommandExpeditionDTO` (`GET /commands/by-date/{date}`, ecran Expeditions) ne porte PAS les trois
  roles, seulement `client` comme avant.
