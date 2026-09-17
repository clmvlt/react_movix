# Pharmacies (coordonnees, fiche) et page commande

Detail extrait de CLAUDE.md. A lire avant de modifier ce domaine.

## Pharmacies : une pharmacie appartient a une entreprise (REGLE CRITIQUE)
Depuis la migration V20 de l'API, une ligne = une pharmacie POUR UN COMPTE. Il n'y a plus de
referentiel global partage, plus de table `pharmacy_informations`, plus de surcharge a la lecture.
- **`id` (UUID) est l'identite STABLE** : cle React, cle de cache, identite de ligne, cle de
  selection. Le `cip` est une donnee metier MODIFIABLE, unique par entreprise seulement : ce n'est
  jamais un identifiant persistant. Seule exception assumee, l'URL `/app/pharmacies/:cip` et
  `pharmacyKeys.detail(cip)`, parce que l'API ne sait lire une pharmacie que par CIP
  (`GET /pharmacies/{cip}`, resolu dans l'entreprise du header `X-Account-Id`).
- L'API renvoie la position dans `latitude` / `longitude` : afficher ce champ tel quel, ne jamais
  reconstruire une position a partir d'une autre source.
- `command.latitude` / `command.longitude` sont la position de LIVRAISON de la commande, pas
  celle de la pharmacie. Pour un trajet, un tri ou un marqueur d'arret, utiliser toujours la
  position de la pharmacie (`stop.latitude` / `stop.longitude` des reponses trajet). Symptome
  typique d'une confusion des deux : un arret dont `previousLeg` vaut ~0 km.
- Renommer le CIP : `PUT /pharmacies/{cip}` accepte `cip` dans le corps. Le renommage CHANGE l'URL
  de la ressource : `useUpdatePharmacy` purge la cle detail de l'ancien CIP et resseme la nouvelle,
  et la page fiche navigue en `replace` vers la nouvelle URL. Conflit dans l'entreprise = 409
  `{"error":"PHARMACY_CIP_ALREADY_USED"}`, rattrape par `ApiError.isPharmacyCipAlreadyUsed` et
  affiche sous le champ CIP par `applyApiError`.
- `POST /pharmacies` renvoie le meme 409 quand le CIP existe deja DANS L'ENTREPRISE. Il n'y a plus
  de rattachement d'une fiche existante d'un autre compte : un doublon est une erreur bloquante.
- `GET /pharmacies/exist/{cip}` est limite au compte courant : `true` ne veut pas dire "ce CIP
  existe dans Movix" mais "vous avez deja cette pharmacie", donc une erreur, pas une information.
- Ne jamais envoyer `accountId` dans le corps d'un POST / PUT pharmacie (retire du contrat).
- Une pharmacie n'existe que pour un compte : tout cache indexe par CIP doit tomber au changement
  d'entreprise. C'est le cas par construction, `dropDataCache()` (`auth-context.tsx`) supprime
  toutes les queries dont la racine n'est pas `auth` a chaque `applySelection`.

## Page pharmacie (fiche, edition, creation)
- Une seule ossature dans les trois modes (`view` / `edit` / `create`) : cinq cartes de section dans le
  meme ordre - Pharmacie (nom, zone, CIP), Adresse, Position (carte), Livraison (creneau, cle, doubles de
  cle, instructions), Contact, Note interne. Chaque carte `src/components/pharmacies/pharmacy-*-card.tsx`
  rend a la fois la lecture et le formulaire ; `pharmacy-sections.tsx` porte la grille (mobile : une
  colonne, la carte Position juste sous l'adresse ; `lg:` : deux tiers pour les sections, carte Position en
  colonne droite sticky via `lg:col-start-3 lg:row-span-5`). Ne jamais omettre une carte
  conditionnellement : le `row-span-5` en depend. Hauteur de la carte sticky : `100dvh - 5.5rem` en
  lecture, `- 9.5rem` en edition (barre d'enregistrement).
- Etat du formulaire : `usePharmacyForm({ baseline, mode, idPrefix })` (`use-pharmacy-form.ts`) :
  snapshot de la fiche pris au montage (jamais l'objet live de la query), `dirty` derive de
  `buildUpdatePayload`, `set` / `patch`, `setPosition(position, source)`, `applyAddress(result)`
  (remplit adresse 1 / code postal / ville ET la position), `validate()` (scroll + focus sur le premier
  champ en erreur, ids via `pharmacyFieldId`), `applyApiError` (`fromApiFieldErrors` mappe `postal_code`
  / `first_name` / `last_name`, cles inconnues -> `formError` affiche en `Alert`). Le mode edition est un
  composant a cle (`<PharmacyEditView key={id}>`) : quitter l'edition demonte tout, rien a purger.
  Le CIP est un champ editable dans les DEUX modes (`create` et `edit`), premiere carte, toujours
  requis (`validatePharmacyForm`) ; `buildUpdatePayload` ne met `cip` dans le corps que s'il a change.
- Position : `api.position` derive de `latitude` / `longitude` (`0/0` ou vide = aucune position). Ligne
  de statut dans la carte Position : "Aucune position" (warning, un tap sur la carte pose le marqueur),
  "L'adresse a change depuis le placement du marqueur" (`positionStale`, comparaison normalisee
  `addressKey` entre l'adresse saisie et celle au dernier placement), "Position definie" + provenance
  (adresse / main / livraisons). Actions : "Localiser depuis l'adresse" (un `orsApi.search` limit 1 via
  `queryClient.fetchQuery`), moyenne des 5 dernieres livraisons, menu : retablir la position
  enregistree, effacer (envoie `0/0`, seul "vide" accepte par l'API), afficher les commandes.
  Coordonnees manuelles derriere "Saisir les coordonnees" (virgule acceptee, normalisation au blur,
  ouverture automatique en cas d'erreur lat / lon).
- `PharmacyMap` prend `marker: LngLat | null` (aucun marqueur sans position), `depot` (marqueur depot,
  jamais draggable), `onMapClick` (seulement sans position), `cooperativeGestures` (uniquement pointeur
  grossier, `matchMedia("(pointer: coarse)")`). Son `MapView` est rendu en `absolute inset-0` : le
  conteneur doit etre `relative` avec une hauteur definie.
- Enregistrement : `<FormSaveBar>` (`src/components/form-save-bar.tsx`), sticky en bas a toutes les
  largeurs, Enregistrer desactive tant que `dirty` est faux, `type=submit` via `formId`. Abandon :
  `useDiscardGuard({ dirty, onLeave })` (`src/components/discard-guard.tsx`) sur Annuler ET la fleche
  retour de l'en-tete (`PageHeader onBack`), plus `beforeunload`. Succes : toast `pharmacies.form.saved`,
  la reponse du PUT est fusionnee dans le cache detail (`useUpdatePharmacy`).
- Historique : exception a la regle 8, entrer en edition depuis la page fait un push de `?edit=1` (le
  retour navigateur revient a la lecture) ; `stopEditing` fait `navigate(-1)` quand c'est la page qui a
  pousse l'entree, sinon supprime le parametre en `replace` (lien profond `?edit=1`, rechargement).
  `?focus=position` ouvre l'edition avec la recherche d'adresse focalisee (bouton "Definir la position"
  d'une fiche sans position). Limite connue : le bouton retour du navigateur quitte l'edition sans
  confirmation (pas de `useBlocker` avec `BrowserRouter`), seuls Annuler, la fleche de l'en-tete et
  `beforeunload` sont gardes.
- Creation : page `/app/pharmacies/new` (`pharmacy-create-page.tsx`, route declaree AVANT
  `/app/pharmacies/:cip`), memes sections en mode `create`, `idPrefix="create"`. Le CIP est verifie a la
  sortie du champ ET avant l'envoi (`pharmaciesApi.exists`, limite au compte courant) : s'il existe,
  message d'erreur sous le champ (`pharmacies.form.cipExists`) et envoi bloque. Aucun rattachement,
  aucun dialog. Le 409 du serveur est le filet de securite, pas le parcours nominal.
- Lignes a bascule : `FieldRow` / `SwitchRow` (`src/components/field-row.tsx`) reproduisent le pattern
  du creneau (cercle d'icone + libelle + resume + controle a droite, `min-h-14`, `tone="warning"`).
  `DeliveryWindowFields` reste intouche et est compose tel quel.
- Piege backend : le mapper ignore `null` (seuls `zoneId` et `deliveryWindow*` acceptent un `null`
  explicite), donc effacer un champ passe par une chaine vide, qui ECRASE la valeur. Le nom est
  obligatoire cote front ; ne jamais envoyer de vide involontaire.
- Photos, commandes et etiquette ne sont pas rendues en edition (un seul perimetre d'enregistrement a
  l'ecran). Les champs editables dans l'espace Rapports (`report-pharmacy-info-section.tsx`) restent une
  copie reduite, hors perimetre.

## Page commande (fiche)
Page `/app/commands/:id` (`src/pages/command-detail-page.tsx`), meme ossature que la page pharmacie :
`PageHeader` (badge statut + creneau dans `titleExtra`, sous-titre "Commande du <date>"), puis
`<CommandSections>` (`src/components/commands/command-sections.tsx`) : grille `lg:grid-cols-3` avec six
cartes `SectionCard` en colonne principale (Expedition, Statut, Commentaire, Colis, Photos, Dernieres
commandes) et la carte Pharmacie en colonne droite sticky (`lg:col-start-3 lg:row-span-6`, mini carte
`PharmacyMap` sur la position de la PHARMACIE). Ne jamais omettre une carte principale
conditionnellement : le `row-span-6` en depend (le tarif est une ligne de la carte Expedition, pas une
carte).
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
- `SectionCard` vit dans `src/components/section-card.tsx` (re-exporte par `pharmacy-fields.tsx`),
  `coarsePointer()` dans `src/lib/pointer.ts`.
