# CLAUDE.md - react_movix

Frontend web (SPA) de Movix, plateforme de gestion de livraisons pharmaceutiques.
React 19 + TypeScript + Vite 6 + Tailwind CSS v4 + shadcn/ui (Radix) + TanStack Query +
React Router v7 + i18next + Mapbox GL. Branche sur l'API Spring Boot `api_movix`
(port 8081, pas de prefixe `/api`). Remplace en place l'ancien `vue_movix`.

## Commandes
- Dev : `npm run dev` (`npm run dev:https` pour un certificat auto-signe)
- Build : `npm run build` (`tsc -b && vite build --mode production`) ; par env : `build:beta`, `build:demo`, `build:prod`
- Lint : `npm run lint` ; Preview : `npm run preview`
- Pas de suite de tests : verification = build + lint + rendu dans le navigateur.

Environnements `dev`, `beta`, `demo`, `prod` : un `.env.<mode>` chacun (`VITE_APP_ENV`, `VITE_API_BASE_URL`,
`VITE_MAPBOX_TOKEN`, `VITE_ORS_BASE_URL`...), ignores par git (modele `.env.example`). Toujours lire la
config via `src/lib/config.ts`, jamais `import.meta.env` ailleurs.

## Version et deploiement
- Version = champ `version` de `package.json`, injectee (`__APP_VERSION__` -> `config.appVersion`) et
  publiee dans `dist/version.json` par le plugin `movix-version-manifest` de `vite.config.ts`.
- `useAppUpdate()` (`src/lib/use-app-update.ts`) compare `/version.json` a la version du bundle
  (5 min, retour d'onglet, retour reseau) et `<UpdateBanner>` propose de recharger. Lecture via
  `http.get` (`baseUrl: window.location.origin`, `auth: false`, `credentials: "omit"`, `cache: "no-store"`).
- Deploiement : `python deploy/deploy.py` (incremente la version, build par env, SCP de `dist/`, verifie
  `https://<url>/version.json`). Cibles `beta.movix.fr`, `demo.movix.fr`, `movix.fr`. Identifiants SSH dans
  `deploy/.env` (ignore), jamais dans `deploy.py`. Ne jamais deployer sans incrementer la version.

## Architecture
- Client HTTP central `src/lib/http.ts` : `http.get/post/put/patch/delete` + `http.blob`. Envoie
  `Accept-Language`, `credentials: include`, `X-Account-Id`, et leve une `ApiError` (`status`, `message`,
  `body`, `fieldErrors`). Intercepteur 401 -> purge session + evenement `movix:unauthorized` ->
  `AuthProvider` redirige vers `/login`.
- Auth : cookie de session httpOnly `auth_token` (8h, pas de refresh). Contexte `src/app/auth-context.tsx`,
  gardes `ProtectedRoute` / `PublicOnlyRoute` dans `src/app/protected-route.tsx`.
- Multi-entreprises : une identite (`userId` non-null) peut appartenir a plusieurs entreprises
  (`accounts[]`, permissions PAR entreprise). Toute requete porte `X-Account-Id` (depuis
  `src/lib/account-selection.ts`). `useAuth().user` est le profil EFFECTIF de l'entreprise selectionnee :
  lire les permissions via `useIsAdmin()`... ; le champ racine `account` n'est pas fiable. `userId` null =
  compte legacy, aucun header. Session sans entreprise (`accounts: []`) = etat valide
  (`no-company-page.tsx`). Detail (switch, invitations, inscription, mot de passe unique, hyperadmin
  membres) : [docs/claude/auth-et-comptes.md](docs/claude/auth-et-comptes.md).
- Donnees serveur : uniquement via TanStack Query (hooks `useXxx`), jamais `useState` + `useEffect` pour
  fetcher. `QueryClient` partage dans `src/lib/query-client.ts`.
- Couche API feature-sliced `src/features/<domaine>/` : `types.ts`, `<domaine>.keys.ts`, `<domaine>.api.ts`
  (`RESOURCE = "/xxx"`), `<domaine>.queries.ts`, `index.ts`. Un domaine n'importe pas l'api / les hooks
  d'un autre (import de type seul tolere). Tous les domaines metier existent deja (auth, profiles,
  commands, tours, pharmacies, anomalies, packages, factures, zones, dashboard, stats, exports...) :
  reutiliser le domaine existant avant d'en creer un.
- UI : pages dans `src/pages/`, composants par domaine dans `src/components/<domaine>/`, primitives
  shadcn dans `src/components/ui/`, hooks transverses dans `src/hooks/`, utilitaires dans `src/lib/`.
  Routing dans `src/App.tsx`, layouts `AuthLayout` (public) / `AppLayout` (protege).
- Providers (`main.tsx`) : `QueryClientProvider` -> `BrowserRouter` -> `AuthProvider` -> `App`.
  `initTheme()` avant le render.

## Contrat API (specificites Movix)
- Erreurs : corps souvent une chaine brute (pas `{message}`), parfois du texte brut malgre un
  Content-Type JSON. Toujours afficher via `apiErrorText`. Validation = 400, lignes `"<champ> <message>"`
  jointes par `\n` (`ApiError.fieldErrors`). Codes JSON routes par helpers `ApiError.isXxx`
  (`EMAIL_NOT_VERIFIED`, `NO_ACCOUNT_ACCESS`, `TourRouteFailure`, `DISPATCH_STALE`...).
- Listes : tableaux bruts le plus souvent ; quelques ressources paginees `{content,totalElements,totalPages,number,size}`.
- PUT partiel historique (cle absente = inchange) ; PATCH seulement sur `/updates/{version}`.
- Temps reel : UNE seule connexion SSE pour toute l'app (`GET /notifications/stream`, client
  `src/lib/sse.ts`, `NotificationsProvider`). L'API est en HTTP/1.1 : ne jamais ouvrir un second flux
  persistant, tout evenement passe par ce flux. Detail : [docs/claude/notifications-sse.md](docs/claude/notifications-sse.md).

## Regles metier a ne jamais enfreindre
- Pharmacies : une pharmacie APPARTIENT a une entreprise (une ligne = une pharmacie pour un compte,
  plus de referentiel global). Identite stable = `id` (UUID) ; le `cip` est une donnee metier
  modifiable, unique par entreprise seulement. Afficher `latitude` / `longitude` renvoyees par l'API,
  n'ecrire que via `PUT /pharmacies/{cip}`. `command.latitude/longitude` = position de livraison,
  pas celle de la pharmacie.
- Mot de passe unique par personne : le champ mot de passe d'un profil ne s'affiche que si
  `userId === null && !isWeb` ; sinon ne JAMAIS envoyer `password` (403).
- Itineraires, ETA, optimisation, repartition : tout est calcule cote serveur. Le front n'appelle JAMAIS
  `/ors/*` pour un trajet et ne duplique aucune regle metier (`src/features/ors/` = geocodage seulement).
- Les endpoints de modification de tournee renvoient le trajet recalcule : appliquer la reponse au cache,
  ne pas refetch. L'ordre de passage n'est jamais enregistre automatiquement.
- Ne jamais envoyer de chaine vide involontaire sur un champ pharmacie (le mapper ignore `null`, une
  chaine vide ecrase la valeur).

## Docs detaillees (a lire AVANT de modifier le domaine concerne)
| Domaine | Fichier |
| --- | --- |
| Auth, multi-entreprises, inscription, invitations, membres, mot de passe | [docs/claude/auth-et-comptes.md](docs/claude/auth-et-comptes.md) |
| Hyperadmin : administration et suppression d'entreprises | [docs/claude/hyperadmin-entreprises.md](docs/claude/hyperadmin-entreprises.md) |
| Consentement cookies, CGU, pages legales | [docs/claude/consentement-cgu-legal.md](docs/claude/consentement-cgu-legal.md) |
| Notifications SSE, `commands-changed`, pastille navbar | [docs/claude/notifications-sse.md](docs/claude/notifications-sse.md) |
| Theme clair / sombre, tokens, `<DateField>` | [docs/claude/ui-theme-et-dates.md](docs/claude/ui-theme-et-dates.md) |
| Cartes Mapbox (`src/components/map/`), API spring-org, geocodage | [docs/claude/cartes-et-geocodage.md](docs/claude/cartes-et-geocodage.md) |
| Page Expeditions, attribution par zone, repartition auto (Beta) | [docs/claude/expeditions.md](docs/claude/expeditions.md) |
| Ordre de passage des tournees, ETA, creneaux de livraison | [docs/claude/tournees.md](docs/claude/tournees.md) |
| Pharmacies (coordonnees, page fiche / edition / creation), page commande | [docs/claude/pharmacies-et-commandes.md](docs/claude/pharmacies-et-commandes.md) |

Toute nouvelle regle d'un domaine va dans son fichier `docs/claude/`, pas ici. Ici : seulement ce qui
s'applique a tout le projet.

## Regles d'or (non negociables)
1. Ne jamais commenter le code sauf demande explicite.
2. Couleurs : source unique `src/lib/colors.ts` (couleur de marque `#123456`), repliquee
   dans le `@theme` de `src/index.css` (et dans `flutter_movix/lib/Theme/movix_colors.dart`). Jamais de
   couleur en dur ailleurs. Tout nouvel ecran doit tenir en mode sombre : tokens shadcn / statut ou
   variante `dark:`, jamais `bg-white`, `text-neutral-*` ou `bg-brand-50` pour une surface ou un texte.
3. Design coherent : espacements multiples de 4, rayons via `--radius`, tokens shadcn
   (`bg-background`, `text-muted-foreground`, `primary`...). Aucun element qui detonne.
4. i18n obligatoire : aucun texte visible en dur ; anglais par defaut ; toute chaine ajoutee
   en EN et FR (`src/i18n/locales/en.json` et `fr.json`) ; messages API localises via `Accept-Language`.
   Reserver l'espace des messages d'erreur (`FormField`).
5. Appels API : jamais de `fetch` brut ; client `src/lib/http.ts` ; donnees via TanStack Query.
6. Responsive obligatoire (mobile ~360px -> desktop large), mobile-first, sans debordement
   horizontal (contenu large -> `overflow-x-auto` dans son conteneur).
7. Pas de caracteres typographiques "IA" : jamais de tiret cadratin/demi-cadratin ni
   ponctuation decorative. Uniquement ponctuation standard et trait d'union simple `-`.
8. Navigation retour qui preserve l'etat : etat des ecrans a filtres dans l'URL
   (`useSearchParams`, ecriture en `replace`) + tout bouton retour via `useBack(fallback)`
   (`src/lib/use-back.ts`). Jamais de retour vers un chemin fixe.
9. Occuper tout l'espace : chaque page remplit largeur et hauteur (`flex-1`, `max-w-7xl`,
   grilles `grid-cols-*` qui montent en colonnes au `lg:`/`xl:`). Verifier le rendu >= 1280px.

## Mobile (mobile-first, non negociable)
Cible : un utilisateur debout, une main, ecran ~360px. Un ecran doit etre utilisable au pouce.
- Une page = un ecran. Hauteur issue du layout (`h-dvh` -> `min-h-0 flex-1` en cascade) : ce sont les
  listes qui defilent (`min-h-0 flex-1 overflow-y-auto`), jamais la page. Pas de double scroll.
- Ecrans "liste + carte + detail" : ne jamais empiler les panneaux sur mobile, basculer avec
  `<ViewSwitch>` (`?view=` en `replace`). Masquer les panneaux inactifs avec `hidden lg:flex` : la carte
  reste montee. Un `flex-1` ajoute pour le mobile doit etre neutralise au desktop (`lg:flex-none`).
- Cibles tactiles >= 40px (`size-10`, `min-h-10`), 44px pour les actions principales (`min-h-11`).
  Boutons icone 28-32px reserves au desktop : `size-11 lg:size-8`.
- Actions sur selection : barre basse `<SelectionBar>` (`src/components/selection-bar.tsx`, `lg:hidden`),
  avec `pb-28 lg:pb-0` sur le conteneur scrollable quand une selection existe.
- Listes horizontales : `overflow-x-auto` + `shrink-0` sur les items, jamais de wrap.
- Dialogs : `DialogContent` gere marge, `max-h-[calc(100dvh-2rem)]` et scroll interne ; ne jamais figer
  une hauteur. Formulaires en une colonne sous `sm:`.
- Jamais de fonction accessible uniquement au survol : tout `title` double d'un `aria-label` et d'une
  action au tap.

## Pieges
- Presse-papiers : jamais `navigator.clipboard.writeText` en direct ; toujours `copyText`
  (`src/lib/clipboard.ts`) + toast `common.copyFailed`. Le repli monte son textarea DANS le
  `[role="dialog"]` actif, sinon le garde de focus du Dialog copie le mauvais champ.
- Tailwind v4 CSS-first : config dans `src/index.css` (`@theme`), pas de `tailwind.config.js`.
  Bordure par defaut = `currentColor` -> toujours preciser (`border-border`). `shrink-0` (pas
  `flex-shrink-0`), `bg-linear-to-r` (pas `bg-gradient-to-r`).
- Radix : UNIQUEMENT via le paquet parapluie `radix-ui`, jamais `@radix-ui/react-*` (regle ESLint) :
  deux copies de `DismissableLayer` / `FocusScope` rendent inertes les popovers ouverts dans un Dialog.
- Dialog/Sheet : toujours via le wrapper `src/components/ui/dialog.tsx` (garde de focus
  `useLayoutEffect` a l'ouverture), jamais `DialogPrimitive.Root` brut. Ne pas retirer ce garde.
- Saisie de date : TOUJOURS `<DateField>` (`src/components/date-field.tsx`), jamais `<Input type="date">`
  nu, et jamais de `pr-*` sur cet input (casse le recouvrement de l'icone Firefox).
- Couleurs de statut : `getStatusTokens()` renvoie des `var(--...)`, reserves au DOM ; pour un canvas ou
  Mapbox, `getStatusPalette(category)` (hex). `applyColorTokens` doit etre rappele a chaque changement
  de theme.
- Cartes : toujours les composants de `src/components/map/`, jamais un `mapboxgl.Map` instancie ailleurs.
- React 19 sans React Compiler configure : pas de sur-memoisation par defaut. Listes tres longues ->
  `@tanstack/react-virtual`. `CommandList` est virtualisee : defiler via
  `listRef.current.scrollToId(id)`, jamais un `ref` sur une ligne.

## Avant de conclure une tache
Verifier build + lint, rendu mobile (~360px) et desktop large (>= 1280px), presence des cles
i18n EN + FR, aucun `fetch` brut, aucune couleur en dur, aucun caractere typographique "IA".
Commits : Conventional Commits en francais (`feat(scope): ...`, `fix(scope): ...`).
