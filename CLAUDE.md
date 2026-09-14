# CLAUDE.md - react_movix

Frontend web (SPA) de Movix, plateforme de gestion de livraisons pharmaceutiques.
React 19 + TypeScript + Vite 6 + Tailwind CSS v4, branche sur l'API REST Spring Boot
`api_movix` (port 8081, pas de prefixe `/api`).

## Commandes
- Dev : `npm run dev`
- Build : `npm run build` (`tsc -b && vite build --mode production`)
- Build par env : `npm run build:beta`, `npm run build:demo`, `npm run build:prod`
- Lint : `npm run lint`
- Preview : `npm run preview`

Environnements : `dev`, `beta`, `demo`, `prod`. Un `.env.<mode>` par environnement,
chacun avec `VITE_APP_ENV` et `VITE_API_BASE_URL`. Les `.env.*` sont ignores par git
(modele : `.env.example`) ; les identifiants SSH du deploiement vivent dans `deploy/.env`
(ignore, modele `deploy/.env.example`), jamais dans `deploy/deploy.py`. Toujours lire la config via
`src/lib/config.ts`, jamais `import.meta.env` en dur ailleurs.

## Version et deploiement
- Source unique de la version : le champ `version` de `package.json`. Il est injecte dans le
  bundle (`__APP_VERSION__` -> `config.appVersion`) et publie dans `dist/version.json`
  (`{version, env, buildTime}`) par le plugin `movix-version-manifest` de `vite.config.ts`.
- Cote client : `useAppUpdate()` (`src/lib/use-app-update.ts`) interroge `/version.json` via
  TanStack Query (toutes les 5 min, au retour d'onglet et au retour reseau, desactive en dev).
  Si la version servie differe de `config.appVersion`, `<UpdateBanner>` (monte dans `App.tsx`,
  donc visible aussi sur login et landing) propose le bouton "Mettre a jour"
  (`window.location.reload()`). Le rejet est memorise par version dans `localStorage`
  (`movix.dismissedVersion`) : le bandeau revient a la version suivante.
- La lecture de `/version.json` passe par `http.get` (`baseUrl: window.location.origin`,
  `auth: false`, `credentials: "omit"`, `cache: "no-store"`), jamais un `fetch` brut.
- Deploiement : `python deploy/deploy.py` (le script se replace seul a la racine du projet).
  Il propose l'environnement, incremente la version, puis fait UN build par environnement
  (`build:beta` / `build:demo` / `build:prod`, donc le bon `.env.<mode>`), sauvegarde le site
  distant, envoie `dist/` en SCP et verifie que `https://<url>/version.json` sert bien la
  nouvelle version. Cibles : `beta.movix.fr`, `demo.movix.fr`, `movix.fr` (memes repertoires
  que vue_movix, ce front le remplace en place).
- Ne jamais deployer sans incrementer la version : les onglets ouverts ne verraient pas la
  mise a jour.

## Architecture
- Client HTTP central : `src/lib/http.ts`. Jamais de `fetch` brut dans le code metier.
  `http.get/post/put/patch/delete` + `http.blob`. Envoie `Accept-Language` (langue i18n),
  `credentials: include`, leve une `ApiError` (`status`, `message`, `body`, `fieldErrors`).
- Auth : cookie de session httpOnly (`auth_token`, 8h, pas de refresh). `src/lib/auth.ts`
  gere un drapeau de session local + l'evenement `movix:unauthorized`. Intercepteur 401
  dans `http.ts` -> purge session + evenement -> `AuthProvider` redirige vers `/login`.
  Endpoints : `POST /auth/login {identifiant,password}`, `POST /auth/register`,
  `GET /auth/me`, `POST /auth/logout`.
- Multi-entreprises : une identite web (`userId` non-null dans login / `/auth/me`) peut
  appartenir a PLUSIEURS entreprises, permissions PAR entreprise dans `accounts[]`
  (`profilId`, `isAdmin/isWeb/isMobile/isStock/isActive`, `identifiant` mobile, `account`).
  Pas de switch serveur : toute requete authentifiee porte `X-Account-Id` (ajoute par
  `http.ts` / `sse.ts` depuis `src/lib/account-selection.ts`, module hors React). `useAuth()`
  expose `accounts`, `selectedAccountId`, `switchAccount`, et son `user` est le profil
  EFFECTIF (id/flags/account de l'entree selectionnee via `applyMembership`) : lire les
  permissions comme avant (`useIsAdmin()`...), elles suivent le switch. `hyperadmin` et les
  champs d'identite (email, nom, birthday, isEmailVerified, googleLinked) restent racine ;
  le champ racine `account` = entreprise la plus ancienne, ne pas s'y fier. Persistance :
  `movix.account.<userId>` (choix par utilisateur) + `movix.account.last` (bootstrap : le
  premier `/auth/me` porte deja le header ; purge par `clearSession`). Switch = purge des
  queries non-`auth` + remount du sous-arbre (cle de Fragment dans `AuthProvider`, l'URL
  survit) + refetch `/auth/me` (la photo suit le header). 403 `NO_ACCOUNT_ACCESS`
  (`ApiError.isNoAccountAccess`, emis par http.ts) -> selection effacee, `/auth/me` refetche
  sans header, reselection ; 400 `ACCOUNT_HEADER_INVALID` = bug front. Le selecteur
  (`src/components/nav/account-switcher.tsx`, navbar) n'apparait qu'avec >= 2 entreprises
  web actives ; sous `sm:` il remplace le BrandMark compact (place navbar). `userId` null =
  compte legacy : aucun header, comportement historique. Profils : `ProfilDTO.userId`
  non-null = rattache a un compte utilisateur (email lecture seule, 409 sinon ; suppression
  = retrait de l'entreprise, l'identite survit) ; la creation peut RATTACHER un utilisateur
  existant (reponse avec `userId`, `check-email` isUsed=false inclut ce cas). MOT DE PASSE
  UNIQUE : une personne n'a qu'un mot de passe, celui de son compte (User), qui ouvre le web
  ET le mobile dans toutes ses entreprises ; personne d'autre ne peut le changer. Le champ
  mot de passe du formulaire profil ne s'affiche donc que si `userId === null && !isWeb`
  (profil mobile autonome) - sinon `<PasswordOwnedNotice>`
  (`src/components/profiles/password-owned-notice.tsx`) explique la regle et propose
  "Envoyer un lien de reinitialisation" (`POST /profiles/forgot-password {email}`, public,
  204 systematique, l'email part vers la personne). Ne JAMAIS envoyer `password` pour ces
  profils : 403 avec un corps en TEXTE BRUT (meme si le Content-Type annonce JSON), a
  afficher tel quel via `apiErrorText`. Meme regle sur
  `PUT /account/{accountId}/members/{profilId}` (hyperadmin). `change-password` change ce
  mot de passe unique. Cloisonnement : un utilisateur NON-admin ne gere que les
  profils MOBILES purs (pas d'edition/suppression d'un profil isWeb ou lie, pas d'octroi
  web/admin, pas d'invitations - l'API renvoie 403) ; le champ email n'apparait dans le
  formulaire profil que si "acces web" est coche (profil mobile = identifiant + mot de
  passe, l'API renvoie email=null). VERROUILLAGE ACCES WEB (non-hyperadmin) : un admin ne
  peut plus creer un profil web ni cocher "acces web" sur un profil non relie (403,
  message API a afficher tel quel) - la creation est mobile-only, et le formulaire
  d'edition d'un profil non relie remplace la case web par le bouton "Donner l'acces web"
  (invitation ciblee). Les permissions d'un profil RELIE (web on/off compris) restent
  librement modifiables. Une session hyperadmin voit EXACTEMENT le meme formulaire que
  l'admin sur la page Profils (creation mobile-only, bouton "Donner l'acces web") meme si
  l'API l'autoriserait a plus : la gestion directe des acces passe par l'onglet
  "Membres" du hyperadmin (`hyper-members-panel.tsx`), pas par ce formulaire.
- Self-service : inscription publique `POST /auth/register` (page `/register`, lien
  depuis `/login` ; rate-limite, 409 = email pris ; AUCUNE creation d'entreprise
  publique, on rejoint par code d'invitation). Le compte n'est cree qu'a la
  confirmation de l'email : le register repond 202 SANS session
  (`RegistrationPending {email, emailSent, retryAfterSeconds, expiresAt}`), la page
  bascule sur `<RegistrationPendingCard>` (bouton "Renvoyer" = `POST /auth/register/resend
  {email}`, toujours 200 avec le meme corps : `emailSent` false + `retryAfterSeconds` > 0 =
  compte a rebours, 0 = aucune demande en attente, proposer inscription / login ; re-soumettre
  le formulaire avec le meme email = nouveau 202, jamais une erreur). Lien recu par email :
  `/confirm-registration?token=X` (`confirm-registration-page.tsx`, hors guards) ->
  `POST /auth/register/confirm {token}` : 201 = ProfilAuth + cookie, traite comme un login
  (`useConfirmRegistration`), 400 `REGISTRATION_TOKEN_INVALID` (48 h) = lien vers
  `/register`, 409 = email pris entre-temps, lien vers `/login`. Retour apres auth :
  `src/lib/auth-redirect.ts` (`movix.authRedirect` en localStorage, `{path, savedAt}`, 7 jours
  max) ; `resolveAuthRedirect(location.state)` = `state.from` (pathname+search+hash) sinon
  le chemin stocke sinon `/app`. Login, register (Google compris) et `/confirm-registration`
  naviguent dessus puis l'effacent ; `PublicOnlyRoute` renvoie aussi un utilisateur deja
  connecte vers ce chemin ; `/verify-email` connecte propose "Continuer" vers ce chemin. Le
  register 202 l'enregistre pour la confirmation (autre onglet). `/verify-email` reste reserve aux comptes crees par un admin
  ou apres changement d'email. Login Google CREE le compte si
  l'email est inconnu (bouton "Continuer avec Google" sur login ET register ;
  `GOOGLE_NO_PROFILE` ne signifie plus "email inconnu" mais compte desactive / conflit
  de lien, simple refus ; email deja pris par un compte NON relie a Google = 409
  `GOOGLE_EMAIL_ALREADY_USED` -> `ApiError.isGoogleEmailUsed` (tout 409 est traite
  ainsi), message "compte existant, connectez-vous puis reliez Google" avec lien vers
  `/login` sur register ; tout autre echec affiche le texte API via `apiErrorText`). Session SANS entreprise = etat valide : login/register/me
  peuvent renvoyer `accounts: []` avec `account: null` et les champs de profil (id,
  identifiant, flags) null - seuls `userId` et l'identite sont garantis. Dans ce cas
  `ProtectedRoute` rend `src/pages/no-company-page.tsx` (saisie d'un code d'invitation,
  encart "verifiez votre email" si `isEmailVerified` false - le join renvoie 403
  `EMAIL_NOT_VERIFIED` tant que l'email n'est pas verifie -, parametres du compte SANS
  la photo (stockee par entreprise), deconnexion), sans jamais deconnecter : un
  `NO_ACCOUNT_ACCESS` qui laisse `accounts` vide aboutit a cet ecran. Routes valides
  sans entreprise (et tolerantes a un header perime) : me, update-profil (ProfilDTO
  d'identite avec id null), change-password, link/unlink-google, resend-verification,
  join. `canAccessWeb` = `isWeb === true` OU `userId` non-null.
- Invitations d'entreprise : domaine `src/features/invitations/` (`/account/invitations`
  list/create/revoke, admin de l'entreprise selectionnee + `userId` non-null ; dialog
  depuis la page Profils). Rejoindre : `POST /account/join {code}` (10 caracteres,
  normalises cote front), entree "Rejoindre une entreprise" dans le menu avatar et le
  selecteur ; au 201 la reponse (AccountMembershipDTO) passe par
  `applyNewMembership` (useAuth) = ajout au cache me + bascule immediate. 404 = code
  invalide/expire/epuise (message unique), 409 = deja membre, 403 = texte serveur tel
  quel (limite de profils ou session legacy), 429 rate-limit. Invitation CIBLEE :
  `POST /account/invitations {profilId}` (maxUses force a 1 ; 409 = profil deja relie ;
  reponse et listing avec `targetProfilId`/`targetProfilName`, badge "Ciblee : X" vs
  "Generique") - a la consommation le compte cree est RELIE a ce profil (identifiant
  mobile et permissions conserves) ; le code devient 404 si le profil est relie ou
  supprime entre-temps (`grant-web-dialog.tsx`, ouvert depuis le formulaire profil).
  Lien public : `SITE_URL/join?code=X` -> page `/join` (`join-page.tsx`, hors guards) :
  `GET /account/join/{code}` PUBLIC (societe + cible, 404 indistinct, 429), boutons
  "Creer un compte" / "J'ai deja un compte" (state.from = retour sur /join apres auth,
  supporte par login ET register ; la page enregistre aussi `/join?code=X` via
  `saveAuthRedirect` tant que l'utilisateur n'est pas connecte, donc le retour survit aux
  liens login <-> register, au mot de passe oublie et a la confirmation d'email dans un
  autre onglet), puis join AUTOMATIQUE une fois connecte (etape "verifiez votre email" sur
  403 EMAIL_NOT_VERIFIED, le chemin stocke est conserve) et bascule ; succes, 404, 409 ou
  code invalide effacent le chemin stocke (`clearAuthRedirect(joinPath)`), jamais de boucle.
- Hyperadmin multi-entreprises : domaine `src/features/members/`
  (`/account/{accountId}/members` - la cible est dans le PATH, PAS le header
  X-Account-Id, l'hyperadmin peut ne pas etre membre). POST sans email = s'ajouter
  soi-meme (case "en tant qu'admin" recommandee), avec email = ajouter un utilisateur
  existant (ignore maxProfiles) ; GET = tous les ProfilDTO ; PUT {profilId} = permissions
  par entreprise sans restriction ; DELETE = retrait. UI : onglet "Membres" du
  hyperadmin (`hyper-members-panel.tsx`) - au 201 du self-join, `registerMembership`
  (ajout au cache me SANS bascule) puis bouton "Basculer" (switch existant). L'ancien
  `PUT /profiles/me/account/{id}` renvoie 403 pour les sessions migrees : SUPPRIME du
  front (ne pas le reintroduire).
- Donnees serveur : uniquement via TanStack Query (hooks `useXxx`). Jamais
  `useState`+`useEffect` pour fetcher. `QueryClient` partage dans `src/lib/query-client.ts`.
- Couche API feature-sliced : `src/features/<domaine>/` avec `types.ts`, `<domaine>.keys.ts`,
  `<domaine>.api.ts` (RESOURCE = "/xxx"), `<domaine>.queries.ts`, `index.ts`. Un domaine
  n'importe pas l'api/les hooks d'un autre (import de type seul tolere, ex. `profiles`
  reutilise le type `Profil` de `auth`). Domaines implementes : `auth` (login/me/logout),
  `profiles` (CRUD + change-password + forgot/reset + verify-email + resend + check-*),
  `invitations` (codes d'invitation d'entreprise + join), `members` (gestion hyperadmin
  des membres par entreprise), `admin-accounts` (administration hyperadmin des entreprises),
  `notifications` (flux SSE + mark read/batch), `updates` (versions APK chauffeur :
  list/latest tries par version semver decroissante, upload POST octet-stream avec query
  `changelog`/`mandatory`, edition `PATCH /updates/{version}`, delete ; erreurs 400/409 en
  texte brut ; `downloadUrl` relatif du serveur prefere, repli `/updates/download/{id}` ;
  champs enrichis `versionCode`/`size`/`sha256`/`changelog`/`mandatory` optionnels et
  nullables, masques quand absents - ancien serveur ou backfill). Les autres domaines metier
  (pharmacies, tournees, commandes, colis, anomalies, factures...) ne sont PAS encore developpes.
- Routing : `src/App.tsx` (React Router v7). Gardes dans `src/app/protected-route.tsx`
  (`ProtectedRoute` / `PublicOnlyRoute`). Contexte auth `src/app/auth-context.tsx`.
- Layouts : `AuthLayout` (public) et `AppLayout` (protege, navbar responsive + burger mobile).
- Providers (`main.tsx`) : `QueryClientProvider` -> `BrowserRouter` -> `AuthProvider` -> `App`.
  Devtools React Query en lazy uniquement en dev. `initTheme()` (`src/lib/theme.ts`) avant le
  render : pose la classe `dark` et appelle `applyColorTokens(theme)`.

## Contrat API (specificites Movix)
- Erreurs : corps souvent une chaine brute (pas `{message}`). Validation = HTTP 400,
  lignes `"<champ> <message>"` jointes par `\n` (voir `ApiError.fieldErrors`). 403
  `EMAIL_NOT_VERIFIED` = objet JSON. PATCH autorise par le CORS depuis la refonte `/updates`
  (premier usage `PATCH /updates/{version}`, necessite l'API a jour) ; les endpoints
  historiques restent en PUT partiel.
- Pagination : la plupart des listes sont des tableaux bruts (ex. `GET /profiles`) ; certaines
  ressources metier non encore developpees renvoient `{content,totalElements,totalPages,number,size}`.
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
- Regle email non verifie : un profil `isWeb` a l'email non verifie recoit `403 EMAIL_NOT_VERIFIED`
  sur les routes protegees sauf `/auth/me`, `/auth/logout`, `/profiles/resend-verification`
  (`ApiError.isEmailNotVerified`).

## Administration des entreprises (hyperadmin)
Domaine `src/features/admin-accounts/` (`/admin/accounts`, tag Swagger "Accounts
administration (hyperadmin)"). Reserve aux sessions dont l'identite porte `hyperadmin`
(sinon 403 sans corps). Ces routes NE dependent PAS de `X-Account-Id` : la cible est
toujours dans le PATH, et l'hyperadmin agit sur des entreprises ou il n'est pas membre.
Administrer une entreprise n'est PAS y naviguer : pour ouvrir ses donnees metier il faut
d'abord s'y ajouter (onglet "Membres", `POST /account/{accountId}/members`) puis basculer.
Les UUID des paths sont mis en MINUSCULES (`normalizeAccountId`, sinon 400).
- UI : onglet "Entreprises" du hyperadmin (`hyper-companies-panel.tsx`, `?tab=companies`,
  recherche `?q=` et filtre `?state=active|inactive` en `replace`), page de creation
  `/app/hyperadmin/companies/new` et page d'edition `/app/hyperadmin/companies/:accountId`.
  Sections communes dans `admin-account-sections.tsx`, etat et payloads dans
  `admin-account-form.ts`. Types renommes pour ne pas percuter `features/account` :
  `AdminAccount`, `AdminAccountCreateInput`, `AdminAccountUpdateInput`.
- TROIS PIEGES du `PUT /admin/accounts/{id}` : (1) `anomaliesEmails` est VIDE quand il est
  absent du corps, alors que tous les autres champs suivent "absent = ne pas toucher" - il
  est donc TOUJOURS renvoye par `buildAdminAccountUpdate`, meme inchange ; (2) `logo` =
  base64 pour remplacer, chaine VIDE pour supprimer, cle absente pour ne rien changer (en
  lecture c'est `logoUrl`, jamais `logo`) ; (3) `defaultTourDepartureTime` est en francais
  strict `"HHhMM"` (`21h00`), valide cote front via `timeInputToFrTime`.
  `maxProfiles` : 0 = ILLIMITE (interrupteur "Profils illimites" dans le formulaire).
  `smtpPassword` revient en clair de l'API : affiche masque, renvoye seulement s'il change.
  Le logo n'est PAS accepte a la creation : apres le 201 la page enchaine un PUT
  (`{anomaliesEmails, logo}`), et un echec de cet envoi n'annule pas la creation.
- Activation / desactivation : route dediee `PUT /admin/accounts/{id}/status {isActive}`
  (elle preserve `anomaliesEmails` toute seule). Ne JAMAIS passer par le PUT complet pour
  ca. La desactivation est le geste par defaut (reversible, conserve tout, refuse toutes
  les sessions web et mobile) ; la suppression est l'exception.
- Suppression en TROIS etapes, jamais en un clic (`account-delete-dialog.tsx`) :
  `GET /admin/accounts/{id}/deletion` = apercu chiffre (aucune suppression) + `pendingRequest`
  non-null si une demande court deja ; `POST .../deletion` = 202, RIEN n'est supprime, un
  lien de confirmation part vers le demandeur lui-meme (`requesterEmail`), `emailSent:false`
  + `retryAfterSeconds > 0` = rate limit (1 email / 2 min) affiche en compte a rebours, pas
  en erreur ; `POST .../deletion/resend` et `DELETE .../deletion` pour renvoyer ou annuler.
  Le dialog exige de RETAPER le nom exact de l'entreprise, montre les volumes detruits et
  rappelle ce qui survit (referentiel pharmacies partage et comptes utilisateurs).
- Page de confirmation `/confirm-account-deletion?token=X`
  (`confirm-account-deletion-page.tsx`, HORS `ProtectedRoute` pour survivre a la perte de la
  derniere entreprise) : exige une session hyperadmin, sinon redirige vers `/login` en
  conservant le token (`state.from` + `saveAuthRedirect`). `GET /admin/accounts/deletion/{token}`
  (404 inconnu, 410 expire) puis `POST /admin/accounts/deletion/confirm {token}` -> 200
  `AccountDeletionResult` (compte rendu `totalDeletedRows` / `filesDeleted` / `deletedRows`).
  403 = le lien appartient a un autre hyperadmin, 404 = demande consommee, 410 = lien expire
  (bouton "Relancer la demande"). Au 200, `useConfirmAccountDeletion` retire l'entreprise des
  caches et invalide `auth.me` (l'`AuthProvider` reselectionne seul une autre entreprise).
- Corps d'erreur heterogenes sur ce domaine : 400 et 403 en TEXTE BRUT, 404 et 410 en
  `{"error": "..."}`, 401 vide. Passer par `apiErrorText` / `useHyperError`.

## Consentement cookies, CGU et pages legales
- Consentement : logique hors React dans `src/lib/consent.ts` (cle `movix.consent`,
  `{version, decidedAt, categories:{necessary, google, analytics}}` ; changer `CONSENT_VERSION`
  fait revenir le bandeau), hook `useConsent()` dans `src/hooks/use-consent.ts`
  (`consent`, `hasDecided`, `isAllowed`, `accept`, `openPreferences`). `<ConsentBanner>` est monte
  dans `App.tsx` a cote de `<UpdateBanner>` et porte aussi le dialog de preferences (ouvert depuis
  le pied de page landing, `/app/settings` et le bouton Google grise). Le bandeau est centre en bas
  au-dessus d'un voile sombre (`bg-black/50`). Pas de croix ni de fermeture
  exterieure : `DialogContent hideClose` + `onInteractOutside` / `onEscapeKeyDown` annules.
- Google : `loadGoogleIdentity()` rejette (`GoogleIdentityBlockedError`) tant que
  `isConsentAllowed("google")` est faux ; `<GoogleAuthButton>` affiche alors un bouton grise avec le
  lien "Modifier". Retirer le consentement apres chargement ne decharge pas le script (jusqu'au
  prochain rechargement). Prop `gate` = overlay + `inert` qui bloque le bouton GIS tant que la case
  CGU de `/register` n'est pas cochee.
- CGU : `POST /auth/register` envoie `acceptedTerms: true` (case obligatoire, erreur de champ
  `acceptedTerms`, 400 `TERMS_NOT_ACCEPTED` -> `ApiError.isTermsNotAccepted`) ; `POST /auth/login/google`
  porte `acceptedTerms` en option. Bloc `terms` OPTIONNEL sur `ProfilAuth`
  (`{accepted, acceptedAt, acceptedVersion, currentVersion}`) : absent = aucune barriere.
  `<TermsGate>` (`src/components/auth/terms-gate.tsx`) est rendu par `ProtectedRoute` (donc
  uniquement sous `/app` et sur l'ecran sans entreprise), seulement si `terms.accepted === false` ET
  `isEmailVerified !== false` (verification d'email d'abord). `POST /auth/accept-terms`
  (`useAcceptTerms`, corps vide) puis invalidation de `auth.me`.
- Pages legales publiques `/legal/terms`, `/legal/privacy`, `/legal/cookies`
  (`src/pages/legal/*`, rendu par `src/components/legal/legal-document.tsx`, liens partages dans
  `legal-links.ts`). Le contenu est un texte de travail en FRANCAIS uniquement dans
  `src/content/legal/fr.ts` (placeholders `[À COMPLÉTER]` mis en evidence) : c'est l'exception voulue a la regle i18n, l'anglais viendra
  dans un `en.ts` du meme format. Ne jamais inventer de mentions legales (SIREN, adresse, DPO).
  La page cookies doit rester alignee sur l'inventaire reel des cles `movix.*` et du cookie
  `auth_token`.

## Theme clair / sombre
- Store hors React `src/lib/theme.ts` (cle `movix.theme` = `light` | `dark`, cle ABSENTE =
  suivre le systeme via `prefers-color-scheme`), hook `useTheme()` (`src/hooks/use-theme.ts` :
  `preference`, `resolved`, `isDark`, `setPreference`), selecteur `<ThemeSwitcher>`
  (`src/components/theme-switcher.tsx`, meme forme que `<LanguageSwitcher>`, place a cote de lui
  partout : navbar, tiroir mobile, layout auth, landing, /join, ecran sans entreprise).
- Le theme est la classe `dark` sur `<html>` (`@custom-variant dark` dans `index.css`), posee par
  un script inline dans `index.html` AVANT le premier rendu (aucun flash), puis tenue par le store
  (changement de preference, changement systeme, evenement `storage` entre onglets). `color-scheme`
  suit la classe : les controles natifs (date, scrollbars) basculent seuls. La meta `theme-color`
  suit aussi.
- Tokens : les tokens shadcn (`--background`, `--card`...) ET les tokens de statut
  (`--color-status-*`) ont une variante dans `.dark` de `index.css`, repliquee dans `statusDark` de
  `colors.ts`. `applyColorTokens(scheme)` ecrit les tokens de statut EN INLINE sur `<html>` : il doit
  etre rappele a chaque changement de theme (le store le fait), sinon l'inline ecrase `.dark`.
- `getStatusTokens()` renvoie des references `var(--color-status-*)` : a utiliser UNIQUEMENT dans
  des styles DOM (`style={{ backgroundColor }}`, classes). Pour un canvas, une image ou Mapbox
  (`MapPins` dessine les pins dans un canvas), prendre une vraie couleur hex via
  `getStatusPalette(category)` ou la palette brute `status`.
- `MapView` sans `styleUrl` suit le theme (`streets-v12` / `dark-v11`) : changer de theme remonte la
  carte (l'effet depend du style), les couches enfants se recreent seules.
- Pieges : `text-status-*-bg` comme teinte d'icone sur fond de marque (rail lateral) devient sombre
  en mode sombre, doubler d'un `dark:text-white/70`. Les surfaces volontairement sombres (visionneuse
  photo, cadre de telephone, panneau brand du layout auth) restent en couleurs fixes. Pour une pastille
  d'icone, `bg-accent text-primary` (jamais `bg-brand-50 text-brand-600`).

## Cartes (Mapbox GL)
- Token : `VITE_MAPBOX_TOKEN` dans chaque `.env.<mode>`, lu via `config.mapboxToken` (jamais `import.meta.env`
  en dur). Token public `pk.*` (cote client, restreint par domaine cote Mapbox).
- Composant reutilisable dans `src/components/map/` - a utiliser pour TOUTE carte, ne pas reinstancier
  `mapboxgl.Map` ailleurs :
  - `<MapView center zoom styleUrl className>` : initialise la carte une fois, gere le token, le
    `ResizeObserver` (indispensable en layout split), expose l'instance via `MapContext`. Style par
    defaut `mapbox://styles/mapbox/streets-v12` (dispo aussi : `dark-v11`, `light-v11`, `satellite-streets-v12`).
  - `<MapMarker longitude latitude color selected title onClick>` : marker reutilisable (element DOM
    stylé en JS, couleur pilotee par la donnee, anneau `selected` en couleur de marque). Enfant de `MapView`.
  - `<MapAutoFit points>` : ajuste le viewport aux points (fitBounds). Enfant de `MapView`.
  - `<MapClick onClick enabled>` : clic sur la carte (curseur croix). Enfant de `MapView`.
  - `<MapPins pins selectedIds onClick>` : couche `symbol` WebGL (une image de pin par couleur, generee
    au vol sur `styleimagemissing`) pour les GRANDS volumes de points (page Expeditions). `MapMarker`
    (un element DOM par marqueur) reste reserve aux cartes a quelques dizaines de marqueurs (tournee,
    ordre de passage, pharmacie). `MapRoute` s'insere sous la couche `PINS_LAYER_ID` quand elle existe.
  - `useMap()` : accede a `{ map, loaded }` depuis un enfant de `MapView`.
  - `MapView` accepte `cooperativeGestures` (deux doigts / Ctrl + molette, textes via `map.cooperative.*`) :
    a reserver aux cartes embarquees dans une page qui defile, et seulement sur pointeur grossier.
- La carte est chargee en lazy (`React.lazy`) via la page Expeditions pour sortir `mapbox-gl` (~1.5 Mo)
  du bundle initial. Importer une carte = importer depuis `@/components/map`.
- CSS Mapbox (`mapbox-gl/dist/mapbox-gl.css`) importe dans `map-view.tsx` (CSS de lib, pas du custom).
- Auth SSE : `EventSource` ne peut pas envoyer de header `Authorization`, d'ou le client `src/lib/sse.ts`
  (fetch + ReadableStream) pour tout flux SSE authentifie. Le flux `GET /commands/expedition-count/{date}/stream`
  n'est PAS utilise (un flux de plus par onglet, thread serveur par connexion) : le nombre de commandes
  non attribuees vient de `GET /commands/unassigned-count/{date}` + evenement `commands-changed`.

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

## Champs date
TOUTE saisie de date passe par `<DateField>` (`src/components/date-field.tsx`). Jamais de
`<Input type="date">` nu dans une page ou un dialog.
- Contrat : l'input reste un `input type="date"` natif (segments jj/mm/aaaa, on clique dans un
  segment et on retape les chiffres par-dessus, fleches haut/bas), mais le calendrier qui s'ouvre
  est celui de shadcn (`Popover` + `Calendar`), jamais le popup du navigateur.
- Mise en oeuvre : l'icone native est masquee en Chromium
  (`[&::-webkit-calendar-picker-indicator]:hidden`) et RECOUVERTE en Firefox (qui ignore ce
  selecteur) par le bouton calendrier, positionne en absolu sur le bord droit avec un fond
  opaque `bg-background` ; c'est lui qui capte le clic.
- Piege : ne jamais ajouter de `pr-*` sur cet input. Firefox place son icone a la fin de la boite
  de contenu, donc un padding droit la decalerait vers la gauche, hors de la zone recouverte.
- API : `value` / `onChange` en date API (`yyyy-MM-dd`), plus `id`, `name`, `min`, `max`,
  `disabled`, `required`, `aria-label`. `className` va sur l'input (ex. `min-h-11 lg:min-h-10`),
  pas sur le conteneur. `min`/`max` grisent aussi les jours hors plage dans le calendrier.
- Le calendrier suit la langue i18n (fr / enGB) et demarre la semaine le lundi.
- `<WorkingDateControl>` reste le controle dedie a la date de travail globale (navbar) : il
  s'appuie lui aussi sur `<DateField>` (saisie au clavier + calendrier shadcn), entoure des
  fleches jour precedent / suivant et du retour a aujourd'hui, visibles a partir de `md:`
  (place insuffisante dans la navbar en dessous).

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
  Aucun temps d'arret en pharmacie n'est modelise.
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

## API spring-org (ors.stack.bzh)
API locale independante d'`api_movix`, 3 briques : routing (GraphHopper), optimisation VRP/TSP (Timefold),
geocoding BAN (Lucene). URL via `VITE_ORS_BASE_URL` -> `config.orsBaseUrl` (prod `https://ors.stack.bzh`,
local `http://localhost:8080`).
- Domaine `src/features/ors/` (types/keys/api/queries/problem/geometry). Client via `http.*` avec
  `{ baseUrl: config.orsBaseUrl, auth: false, credentials: "omit" }` : API publique, et le serveur renvoie
  `Access-Control-Allow-Origin` sans `Allow-Credentials` (un `credentials: include` casse l'appel).
- Chaque brique se charge en asynchrone au demarrage et repond 503 tant qu'elle n'est pas prete :
  `useRoutingStatus` / `useGeocodingStatus` repollent tant que `ready` est faux ; erreurs 400/503 en
  ProblemDetail (`orsProblem`, `isOrsUnavailable`, `isOrsInvalidRequest`).
- Geometries en `[lat,lon]` cote ORS : convertir avec `orsGeometryToLngLat` / `orsPointsToLngLat` avant
  de passer a Mapbox. `geometryFormat: "POLYLINE"` pour les longs trajets, `"NONE"` si la trace est inutile.
- `POST /optimization/optimize` : toujours inspecter `skippedVisits[]` (visites `UNROUTABLE` / `TOO_FAR`
  ecartees silencieusement) avant d'afficher une tournee.
- Recherche d'adresse : `<AddressSearch>` (`src/components/address-search.tsx`), a reutiliser partout ;
  biais de proximite via `near` ([lon,lat]).

## Regles d'or (non negociables)
1. Ne jamais commenter le code sauf demande explicite.
2. Couleurs : source unique `src/lib/colors.ts` (couleur de marque `#123456`), repliquee
   dans le `@theme` de `src/index.css`. Jamais de couleur en dur ailleurs. Tout nouvel ecran
   doit tenir en mode sombre : tokens shadcn / statut ou variante `dark:`, jamais `bg-white`,
   `text-neutral-*` ou `bg-brand-50` pour une surface ou un texte (cf. section Theme).
3. Design coherent : espacements multiples de 4, rayons via `--radius`, tokens shadcn
   (`bg-background`, `text-muted-foreground`, `primary`...). Aucun element qui detonne.
4. i18n obligatoire : aucun texte visible en dur ; anglais par defaut ; toute chaine ajoutee
   en EN et FR (`src/i18n/locales/`) ; messages API localises via `Accept-Language`. Reserver
   l'espace des messages d'erreur (`FormField`).
5. Appels API : jamais de `fetch` brut ; client `src/lib/http.ts` ; donnees via TanStack Query.
6. Responsive obligatoire (mobile ~360px -> desktop large), mobile-first, sans debordement
   horizontal (contenu large -> `overflow-x-auto` dans son conteneur). Voir la section Mobile :
   chaque ecran doit etre pilotable au pouce, pas seulement "ne pas casser" en petit.
7. Pas de caracteres typographiques "IA" : jamais de tiret cadratin/demi-cadratin ni
   ponctuation decorative. Uniquement ponctuation standard et trait d'union simple `-`.
8. Navigation retour qui preserve l'etat : etat des ecrans a filtres dans l'URL
   (`useSearchParams`, ecriture en `replace`) + tout bouton retour via `useBack(fallback)`
   (`src/lib/use-back.ts`). Jamais de retour vers un chemin fixe.
9. Occuper tout l'espace : chaque page remplit largeur et hauteur (`flex-1`, `max-w-7xl`,
   grilles `grid-cols-*` qui montent en colonnes au `lg:`/`xl:`). Verifier le rendu >= 1280px.

## Mobile (mobile-first, non negociable)
Cible : un utilisateur debout, une main, ecran ~360px. Un ecran doit etre utilisable au pouce,
pas seulement lisible. Verifier a 360px avant de conclure une tache.
- Une page = un ecran. La hauteur vient du layout (`h-dvh` -> `min-h-0 flex-1` en cascade) :
  ce sont les listes qui defilent (`min-h-0 flex-1 overflow-y-auto`), jamais la page entiere.
  Pas de double scroll (page + panneau), pas d'empilement infini.
- Ecrans "liste + carte + detail" (expeditions, tournees) : ne jamais empiler les panneaux
  sur mobile. Basculer avec `<ViewSwitch>` (`src/components/view-switch.tsx`), vue courante
  dans l'URL (`?view=`, ecriture en `replace`, cf. regle 8) pour survivre au retour arriere.
  Masquer les panneaux inactifs avec `hidden lg:flex` / `hidden lg:block` : la carte reste
  montee (pas de reinitialisation Mapbox, l'etat de navigation est conserve). `MapAutoFit`
  ignore le fit tant que le conteneur est a taille zero et recadre au retour de la vue.
- Attention aux classes conditionnelles de layout : un `flex-1` ajoute pour le mobile doit
  etre neutralise au desktop (`lg:flex-none`), sinon l'URL `?view=` casse le rendu large.
- Cibles tactiles : >= 40px (`size-10`, `min-h-10`), 44px pour les actions principales
  (`min-h-11`, `size-11`). Les boutons icone de 28-32px (`size-7`/`size-8`) sont RESERVES au
  desktop : ecrire `size-11 lg:size-8` ou dupliquer la barre (`hidden lg:flex` / `lg:hidden`).
- Actions sur selection : pas de barre d'outils dense en haut, mais une barre basse a portee
  du pouce, `<SelectionBar>` (`src/components/selection-bar.tsx`) - fixe, `lg:hidden`,
  safe-area iOS geree. Boutons avec libelle court (`expeditions.actionsShort.*`) via
  `<CommandActions layout="bar">`. Prevoir le padding bas du conteneur scrollable
  (`pb-28 lg:pb-0`, uniquement quand la selection existe : ajoute en fin de scroll, donc
  aucun decalage du contenu).
- Listes horizontales de selection (ex. chips de tournees) : `overflow-x-auto` + `shrink-0`
  sur les items, jamais de wrap qui fait grandir l'entete.
- Dialogs : `DialogContent` gere deja marge laterale, `max-h-[calc(100dvh-2rem)]` et scroll
  interne ; ne jamais figer une hauteur ni retirer ce scroll. Formulaires en une colonne
  sous `sm:` (pas de `grid-cols-2` non conditionnelle).
- Jamais de fonction accessible uniquement au survol (`title`, hover) : sur mobile il n'y a
  pas de hover. Tout `title` doit etre double d'un `aria-label` et d'une action au tap.

## Pieges
- Presse-papiers : jamais `navigator.clipboard.writeText` en direct (absent en http non-localhost,
  echec silencieux) ; toujours `copyText` de `src/lib/clipboard.ts` (repli `execCommand`) + toast
  d'echec `common.copyFailed`. Le repli monte son textarea DANS le `[role="dialog"]` actif :
  ajoute au `body`, le garde de focus du Dialog reprend le focus et c'est le mauvais champ qui
  serait copie.
- Tailwind v4 CSS-first : config dans `src/index.css` (`@theme`), pas de `tailwind.config.js`.
  Bordure par defaut = `currentColor` -> toujours preciser (`border-border`). `shrink-0` (pas
  `flex-shrink-0`), `bg-linear-to-r` (pas `bg-gradient-to-r`).
- Radix : UNIQUEMENT via le paquet parapluie `radix-ui` (`import { Dialog as DialogPrimitive } from "radix-ui"`),
  jamais un `@radix-ui/react-*` individuel (regle ESLint `no-restricted-imports`). Chaque paquet individuel
  embarque sa propre copie de `DismissableLayer` / `FocusScope` : avec deux versions, un Popover / menu
  ouvert DANS un Dialog n'est pas enregistre dans la pile du dialog, herite du `pointer-events: none` du
  body et se fait voler le focus par le dialog -> calendrier / menu inerte, d'apparence "grisee"
  (incident : `DateField` dans le dialog facture du hyperadmin, popover 1.1.23 vs dialog 1.1.19).
- Dialog/Sheet : garde de focus obligatoire (`useLayoutEffect` qui defocalise l'exterieur a
  l'ouverture, cf. `src/components/ui/dialog.tsx`). Toujours passer par le wrapper, jamais
  `DialogPrimitive.Root` brut. Ne pas retirer ce garde.
- React 19 + React Compiler : ne pas sur-memoiser. Listes tres longues -> virtualisation
  (`@tanstack/react-virtual`). `CommandList` est virtualisee : seules les lignes visibles (+ overscan)
  sont montees, donc jamais de `ref` sur une ligne pour y defiler ; utiliser le handle
  `ref={listRef}` + `listRef.current.scrollToId(id)` (`CommandListHandle`).

## Avant de conclure une tache
Verifier build + lint, rendu mobile (~360px) et desktop large (>= 1280px), presence des cles
i18n EN + FR, aucun `fetch` brut, aucune couleur en dur, aucun caractere typographique "IA".
