# Pharmacies (coordonnees, fiche) et page commande

Detail extrait de CLAUDE.md. A lire avant de modifier ce domaine.

## Pharmacies : coordonnees et infos par compte (REGLE CRITIQUE)
Une pharmacie porte DEUX jeux d'informations cote serveur : la fiche globale (table `pharmacy`,
partagee par tous les comptes) et la fiche du compte (`pharmacy_informations`). **La fiche du
compte prime TOUJOURS** : nom, adresse, ville, telephone et surtout latitude / longitude.
- L'API renvoie deja la valeur resolue dans `latitude` / `longitude` : afficher ce champ tel
  quel, ne jamais reconstruire une position a partir d'une autre source.
- L'edition depuis la page pharmacie (`PUT /pharmacies/{cip}`) n'ecrit QUE la fiche du compte.
  Ne jamais appeler d'endpoint "base" (fiche globale) depuis ce front : il est reserve a
  l'admin et modifierait la position pour tous les comptes.
- `command.latitude` / `command.longitude` sont la position de LIVRAISON de la commande, pas
  celle de la pharmacie. Pour un trajet, un tri ou un marqueur d'arret, utiliser toujours la
  position de la pharmacie (`stop.latitude` / `stop.longitude` des reponses trajet).
- Incident de reference : une fiche globale geocodee sur le depot faisait trier la pharmacie
  collee au depot par l'auto-tri, alors que la page pharmacie affichait la bonne position
  (celle du compte). Symptome typique : un arret dont `previousLeg` vaut ~0 km.

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
  composant a cle (`<PharmacyEditView key={cip}>`) : quitter l'edition demonte tout, rien a purger.
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
  sortie du champ ET avant l'envoi (`pharmaciesApi.exists`) ; s'il existe, "Charger cette pharmacie"
  prefille depuis le referentiel (`api.reset(loaded)`) et l'envoi passe par POST avec le diff
  (`buildUpdatePayload` contre la reference) : c'est le POST qui rattache au compte. Plus de dialog.
- Lignes a bascule : `FieldRow` / `SwitchRow` (`src/components/field-row.tsx`) reproduisent le pattern
  du creneau (cercle d'icone + libelle + resume + controle a droite, `min-h-14`, `tone="warning"`).
  `DeliveryWindowFields` reste intouche et est compose tel quel.
- Piege backend : une chaine vide envoyee sur un champ "resolu" (nom, adresse, ville, telephone...) est
  stockee comme surcharge vide definitive du referentiel (le mapper ignore `null`, seuls `zoneId` et
  `deliveryWindow*` acceptent un `null` explicite). Le nom est obligatoire cote front ; ne jamais
  envoyer de vide involontaire.
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
