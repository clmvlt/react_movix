# Page Expeditions et repartition automatique

Detail extrait de CLAUDE.md. A lire avant de modifier ce domaine.

## Page Expeditions (liste + carte)
- Filtres statut / zone : `src/components/expeditions/expedition-filters.tsx` (bouton + popover,
  multi-selection, compteur par option). Etat dans l'URL (`?status=3,5&zone=<id>,none`, ecriture
  en `replace`, cf. regle 8). Liste, pins et auto-fit de la carte derivent de `visibleCommands` ;
  changer un filtre vide la selection. La zone est `pharmacy.zone {id,name}` de
  `GET /commands/by-date/{date}` (zone de la fiche du compte, `null` = "Sans zone", valeur `none`
  dans l'URL) ; les options viennent de `GET /zones` (`useZones`).
- Barre mobile : `ViewSwitch compactLabels` (conteneur `@container`, libelles en `sr-only` sous
  220px de large : icone + compteur seulement) pour caser filtre + affectees + trajets a 360px.
  Le popover de filtres borne sa hauteur par `--radix-popover-content-available-height`
  (jamais `100dvh - X`, qui deborde sous le bouton) avec `collisionPadding={8}`.
- Tout selectionner : case dans la barre desktop et ligne `lg:hidden` au-dessus de la liste,
  portee = `visibleCommands` (filtres et "affectees" respectes).
- Attribution par zone : option "Attribuer automatiquement selon les zones" en tete du dialog
  "Affecter a une tournee" de `CommandActions`, pleine largeur au-dessus de la liste des tournees
  (jamais dans le pied : a cote de "Retirer de la tournee" elle debordait du dialog), presente
  seulement avec la prop `zoneAssign` (page Expeditions). Elle ferme ce dialog et ouvre
  `zone-assign-dialog.tsx` (pas d'action dediee dans la barre) ; logique pure dans `zone-assign.ts`. L'API
  n'a PAS d'endpoint dedie : les commandes sont groupees par `pharmacy.zone.id`, la cible est la
  tournee du jour dont `tour.zone.id` correspond (tournees non cloturees). Une seule tournee =
  preselectionnee ; plusieurs = choix explicite obligatoire (rien par defaut) ; aucune = zone
  signalee et ignoree ; commandes sans zone jamais touchees. `useAssignCommandsByTour` enchaine
  les `PUT /commands/assign/{tourId}` UN PAR UN (chaque appel recalcule les trajets) et collecte
  les echecs par tournee : un echec partiel garde le dialog ouvert avec le texte API par tournee.

## Repartition automatique des tournees (Beta, page Expeditions)
Bouton "(Beta) Repartir automatiquement les tournees" en surimpression en haut a gauche de la carte
d'Expeditions (`dispatch-launcher.tsx`), qui ouvre `src/components/dispatch/dispatch-dialog.tsx`.
TOUT le calcul et l'application sont faits par l'API (`toursApi.dispatchPreview` / `dispatchApply`,
hooks `useTourDispatchPreview` / `useTourDispatchApply`). Le front n'appelle JAMAIS spring-org pour
cette fonctionnalite et ne duplique aucune regle metier (visites, regroupement par pharmacie, creneaux,
heure de depart par defaut, temps d'arret, coordonnees, rapprochement avec les tournees existantes,
evaluation de l'existant) : il ne garde que l'interface.
- Apercu `POST /tours/dispatch/preview` (aucune ecriture) : `commandIds` = perimetre filtre par la
  liste (statut, zone), commandes non affectees, plus celles des tournees non cloturees avec
  "Inclure les commandes deja affectees". Le serveur ecarte et signale le reste (`excludedCommands`,
  information et non erreur). `departureTime` absent = heure par defaut du compte ; saisie = heure de
  Paris sans offset (`yyyy-MM-ddTHH:mm:00`). `stopServiceSeconds` 180 par defaut, `maxSolvingSeconds`
  10 / 20 / 45. Timeout HTTP = `maxSolvingSeconds + 120` s, annulable. Erreurs : 400 texte brut, 422 /
  503 JSON `TourRouteFailure` (`tourRouteFailureOf`, afficher `detail` + `correlationId`, 503 =
  "Reessayer" avec la meme requete).
- Resultat : `proposed` vs `current` (`current.commands` peut etre inferieur, les non affectees n'y
  sont pas : le dire). Le `timeWindowViolations` du haut compte des PHARMACIES, celui des `Workload`
  des COMMANDES : ne jamais les comparer. `Proposal.route` a la forme de `GET /tours/{id}/route` ; les
  arrets consecutifs d'une meme pharmacie sont regroupes a l'affichage (`proposalStops`). Tournee
  existante (`matchedTourId`) : nom et couleur non modifiables ; nouvelle : nom obligatoire (bouton
  bloque sinon) et couleur modifiables (defauts "Tournee N" sans collision, palette sans les couleurs
  prises). `releasedTours` ne sont pas supprimees : prevenir.
- Application `POST /tours/dispatch/apply` : propositions non `unchanged` seulement, `tourId` =
  `matchedTourId`, `commandIds` dans le meme ordre, `expected` = copie EXACTE de l'apercu. Une seule
  transaction serveur puis recalcul des trajets de toutes les tournees touchees : les `routes` vont
  dans le cache `tourKeys.route`, commandes et tournees du jour sont rechargees. `routeFailures`
  n'est pas un echec (bouton "Recalculer le trajet" = `useRefreshTourRoute`). 409 JSON
  `DISPATCH_STALE` (`dispatchStaleOf`) = rien n'est ecrit, "La situation a change depuis le calcul"
  + relance de l'apercu avec la meme requete ; 409 texte = afficher le texte et proposer la relance ;
  400 texte = bug front (console + message) ; pas de reponse (timeout, reseau) = l'application a pu
  aboutir, faire verifier les tournees.
