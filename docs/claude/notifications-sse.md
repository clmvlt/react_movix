# Notifications et flux SSE

Detail extrait de CLAUDE.md. A lire avant de modifier ce domaine.

- Notifications : SEULE source de donnees = le flux SSE `GET /notifications/stream` (aucune route de
  lecture REST, pas de pagination, pas de suppression). Evenement NOMME `notifications`, payload
  `{notifications[], unreadCount}` = toutes les non lues + les 10 lues les plus recentes. Le serveur
  n'emet que si `unreadCount` change (sinon commentaire `: heartbeat`), premier tick immediat a la
  connexion. Ecriture : `PUT /notifications/{id}/read` et `PUT /notifications/read-batch` (corps =
  tableau brut d'UUID, `markedCount < ids.length` est normal). Retention serveur 30 jours.
  Cote front : client SSE `src/lib/sse.ts` (fetch + ReadableStream, expose le status HTTP, envoie le
  Bearer quand il existe - `EventSource` ne le peut pas), UNE seule connexion pour toute l'app via
  `NotificationsProvider` (`src/app/notifications-context.tsx`), marquage lu optimiste, resynchro au
  retour d'onglet / retour reseau / toutes les 15 min, arret apres 3 echecs (pas de boucle sur 401).
  L'API est servie en HTTP/1.1 (6 connexions par domaine, partagees entre TOUS les onglets) : ne
  jamais ouvrir un second flux SSE persistant, tout evenement temps reel passe par ce flux. Les autres
  evenements nommes sont transmis via le parametre `onEvent` de `useNotificationCenter`, traites dans
  `NotificationsProvider`. `commands-changed` `{dates: ["yyyy-MM-dd"] | null}` (commandes creees,
  attribuees, desattribuees, supprimees, mises en souffrance / restaurees, changement d'`expDate`,
  tournee supprimee) -> `invalidateCommandDates` (`src/features/commands/commands.events.ts`) invalide
  le compteur et la liste `by-date` de ces jours (`null` = tous).
- Pastille navbar "commandes non attribuees" : `GET /commands/unassigned-count/{date}` -> `{date, count}`
  (meme definition que la page Expeditions : `tour` null, hors souffrance), pour la date de travail.
  `useNavBadges()` (`src/components/nav/use-nav-badges.ts`, pastille `NavCountBadge` dans
  `nav-badge.tsx`) est appele UNE seule fois dans `AppLayout` et
  passe aux navs (rail, tiroir mobile, bouton burger) : un seul observateur, donc un seul minuteur de
  polling. `NavItem.badge` rattache une pastille a une entree. Fraicheur : invalidation par les
  mutations (`commandKeys.all`, suppression de tournee comprise), par `commands-changed`, au retour
  d'onglet, et polling de secours (60 s si le flux est coupe, 5 min sinon, jamais en arriere-plan).

- Auth SSE : `EventSource` ne peut pas envoyer de header `Authorization`, d'ou le client `src/lib/sse.ts`
  (fetch + ReadableStream) pour tout flux SSE authentifie. Il n'y a PAS de flux SSE dedie au compteur
  d'expeditions (l'API n'en expose plus : un flux de plus par onglet, thread serveur par connexion) : le nombre
  de commandes non attribuees vient de `GET /commands/unassigned-count/{date}` + evenement `commands-changed`.
