# Ordre de passage des tournees et creneaux de livraison

Detail extrait de CLAUDE.md. A lire avant de modifier ce domaine.

## Triage des tournees (ordre de passage)
Page dediee `src/pages/tour-order-page.tsx` (`/app/tours/:id/order`), atteinte depuis le
panneau d'infos de la page Tournees.
- Le front N'APPELLE JAMAIS `/ors/*`. Tout l'itineraire est calcule cote serveur (depot,
  coordonnees, optimisation, troncons, ETA). `src/features/ors/` reste reserve au geocodage
  d'adresse (spring-org).
- L'ordre n'est JAMAIS enregistre automatiquement : bouton "Enregistrer l'ordre" explicite.
  Il est actif des qu'une difference est detectee entre l'ecran et le serveur : ordre local
  different, tournee `sorted: false` (badge "A trier"), ou trajet enregistre absent /
  `routeStale` (ETA, duree, distance perimes). Il appelle TOUJOURS
  `PUT /tours/update-order/{id}` avec l'ordre courant, meme identique a l'ordre enregistre :
  le serveur remarque la tournee `sorted`, recalcule et persiste le trajet, la reponse
  remplace le cache et un toast `tours.order.saved` confirme. Jamais de faux enregistrement
  (spinner sans appel) : s'il n'y a rien a ecrire, le bouton est desactive. L'heure de
  depart locale n'est PAS un critere : elle n'est jamais persistee (voir ETA plus bas).
- Des que l'ordre local change, le trajet est recalcule cote serveur en APERCU (sans rien
  persister) : `POST /tours/{id}/route/preview` (corps identique a `update-order`) -> `TourRoute`.
  Appel debounce 400 ms, `useTourRoutePreview` (query cachee par signature d'ordre, donc undo/redo
  et retour a un ordre deja vu sont instantanes). Tant que l'ordre local differe de l'ordre
  enregistre, carte / distance / duree / ETA viennent de cet apercu, jamais de l'ordre enregistre.
  Jamais de segments droits entre les points, c'est un faux itineraire : pendant le calcul on
  garde le dernier trace connu, attenue, avec l'indicateur "recalcul du trajet". Si l'apercu
  echoue (422 / 503), avertissement `tours.order.previewFailed` et on reste sur le dernier trace.
- Le bouton "Recalculer" (`POST /tours/{id}/route/refresh`) ne concerne QUE le trajet enregistre :
  il n'apparait que si l'ordre local est propre et que ce trajet est absent ou `routeStale`
  (typiquement un 503 au moment de l'enregistrement). En flux normal il n'a plus lieu d'etre.
- CHAQUE ENDPOINT DE MODIFICATION RENVOIE LE TRAJET RECALCULE, de façon synchrone :
  `PUT /tours/update-order/{id}` -> `TourRoute`, `PUT /commands/assign/{tourId}` et
  `PUT /commands/unassign` -> `TourRoute[]` (la cible ET chaque tournee source),
  `POST /tours/{id}/optimize` avec `apply:true` -> `route` a jour. Appliquer la reponse au
  cache, ne pas refetch. Il n'y a PAS de flux SSE pour les tournees : `EventSource` ne peut pas
  porter le Bearer, et la dependance a un push n'existe plus.
- Lecture : `GET /tours/{id}/route` (lecture base, instantane),
  `POST /tours/{id}/route/refresh` (recalcul force) et `POST /tours/{id}/route/preview`
  (calcul d'un ordre arbitraire, aucune ecriture en base).
- Echec de trajet : `422` = sequence non routable, inutile de reessayer, corriger des
  coordonnees ; `503` = moteur indisponible, l'ancien trace est CONSERVE, reessayer peut
  aboutir. Corps JSON `TourRouteFailure` `{reason, detail, correlationId, retryable}` : afficher
  `detail` tel quel et garder `correlationId` visible (il est dans les logs serveur). Ce sont
  les deux seuls corps d'erreur JSON avec `EMAIL_NOT_VERIFIED`.
- `POST /tours/{id}/optimize` : `{apply:false}` = apercu. `order` est TOUJOURS complet (le
  serveur place `skippedVisits` et `commandsWithoutCoordinates` en fin) mais ces deux listes
  doivent etre signalees : l'optimiseur TOLERE les coordonnees hors zone alors que le calcul
  d'itineraire ECHOUE dessus, donc appliquer un ordre qui en contient produira un trajet en
  echec. Le trace propose est `previewGeometry` (peut etre `null`), PAS `route` qui reste le
  trajet actuel en mode apercu. 400 = compte sans coordonnees de depot, 503 = optimiseur
  indisponible (coupe-circuit 30 s, ne pas retenter en boucle).
- `PUT /tours/update-order/{id}` : payload = TOUTES les commandes de la tournee, une seule fois
  chacune, sans position en double (sinon 400) ; toutes doivent appartenir a la tournee (sinon
  409) ; `tourOrder` strictement positif, les positions ne sont qu'un ordre relatif, le serveur
  renumerote en `1..n`. `autoUpdateRoute` est deprecie et ignore. Tournee cloturee -> 409.
  Composition d'une tournee : union de `tour.commands` (`GET /tours/{id}`) et de
  `GET /commands/by-date/{date}` filtre sur `command.tour.id`, la seconde source faisant foi
  sur l'appartenance mais ne couvrant que les `expDate` du jour demande.
- ETA : `stop.estimatedArrivalTime` et `stop.cumulativeDurationMins` viennent du serveur.
  Les heures d'arrivee sont TOUJOURS affichees sur les arrets (pas d'option pour les masquer),
  attenuees tant que le trajet affiche ne correspond pas a l'ordre courant. L'heure de depart est
  un champ `time` en haut de page, suivi du retour estime : la saisie recalcule les heures EN
  LOCAL (`depart + cumulativeDurationMins`), sans appel reseau. Il n'existe PAS de
  `plannedDepartureTime` : l'heure de depart n'est jamais persistee, c'est un affichage pur,
  initialise depuis `tour.startDate` (depart reel) sinon l'heure par defaut du compte
  (`account.defaultTourDepartureTime`, format "21h00", reglee dans Parametres -> Options).
  Le serveur compte un temps d'arret fixe de 3 min par pharmacie (`TourEta.STOP_SERVICE_SECONDS`),
  deja inclus dans `estimateMins`, `cumulativeDurationMins` et les ETA.
- Ne jamais envoyer `geometry`, `estimateKm` ou `estimateMins` calcules cote front dans
  `PUT /tours/{id}` : ils sont ecrits tels quels et ecrases au prochain recalcul.
- `GET /tours/by-date-range` renvoie `geometry: ""` : jamais pour la carte.

## Creneaux de livraison (fenetres horaires par pharmacie)
- Fiche pharmacie (fiche du compte) : `deliveryWindowStart` / `deliveryWindowEnd` en `"HH:mm"` strict
  (24 h, sans date ni fuseau, afficher tel quel). Bornes independantes, un creneau peut passer minuit :
  ne JAMAIS valider `start < end`. Sur le PUT, `null` explicite efface la borne, cle absente = inchange
  (`buildUpdatePayload` envoie `null` quand le toggle est decoche ou le champ vide).
- UI : `<DeliveryWindowFields>` (`src/components/pharmacies/delivery-window-fields.tsx`, toggle
  "Pas d'importance" par defaut + deux champs heure effacables) dans le dialog ET la page pharmacie ;
  badge `<DeliveryWindowBadge>` (`src/components/delivery-window-badge.tsx`) partout ou une pharmacie
  ou une commande est listee (`CommandDTO.pharmacyDeliveryWindowStart/End`).
- Auto-tri : `POST /tours/{id}/optimize` recoit TOUJOURS `departureTime` (ISO avec offset, construit
  par `localOffsetIso(date, heure)` : la date est celle de la tournee, jamais saisie, seule l'heure est
  un champ de la page d'ordre). Changer l'heure ne declenche AUCUN appel : les creneaux sont reverifies
  en local et le bandeau rouge suit. La reponse porte
  `departureTime` retenu, `feasible` (`false` = ordre renvoye mais >= 1 creneau intenable, `null` =
  moteur non appele), `timeWindowViolations`, `waitingTimeMins`, `previewRoute`. `previewRoute` est
  injecte dans le cache `routePreview` pour eviter un second appel.
- `TourRoute` : `feasible`, `timeWindowViolations`, `waitingTimeMins` ; `estimateMins` n'inclut PAS
  les attentes (duree affichee = `estimateMins + waitingTimeMins`). Chaque `stop` : `deliveryWindowStart/End`
  resolus sur le jour de la tournee (ISO), `estimatedArrivalTime`, `estimatedServiceStartTime`,
  `waitingMins`, `lateMins`, `late`.
- Page d'ordre : quand l'heure de depart locale = `route.departureTime`, les indicateurs viennent du
  serveur ; sinon `buildSchedule` rejoue les ecarts serveur (arrivee = fin de service precedente +
  ecart) et recalcule attentes / retards en local, sans appel reseau. Si le trajet n'a ni
  `departureTime` ni ETA (ancien serveur), les ecarts viennent de `cumulativeDurationMins`. Les bornes
  de creneau sont fusionnees borne par borne : valeur serveur du `stop` (ISO ou "HH:mm") sinon
  `pharmacyDeliveryWindowStart/End` de la commande, resolue sur le jour de depart (fin < debut =
  lendemain) ; ne jamais afficher une seule borne quand la fiche en a deux. `GET /commands/by-date`
  (CommandExpeditionDTO) n'a PAS `pharmacyDeliveryWindow*`, seulement `pharmacy.deliveryWindow*` : lire
  les deux. Une attente > 60 min (`MAX_WAITING_MINS`) rend le creneau NON TENABLE (rouge, compte dans
  "non tenables", confirmation a l'enregistrement), meme si le serveur ne signale pas de retard. Les lignes d'arret gardent UNE
  seule hauteur : un badge compact en ligne (icone + creneau court, texte masque sous `sm:`), rouge si
  retard (ligne et heure d'arrivee en rouge, pastille "!" sur le marqueur), orange si attente, vert si
  tenu ; le detail (retard / attente en minutes, arrivee vs livraison) est dans le `title` / `aria-label`.
  Bandeau rouge si >= 1 retard (liens vers les fiches pharmacie dans un nouvel onglet), enregistrer un
  ordre avec retard demande confirmation.
