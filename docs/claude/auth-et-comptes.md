# Auth, multi-entreprises, inscription, invitations

Detail extrait de CLAUDE.md. A lire avant de modifier ce domaine.

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

- Regle email non verifie : un profil `isWeb` a l'email non verifie recoit `403 EMAIL_NOT_VERIFIED`
  sur les routes protegees sauf `/auth/me`, `/auth/logout`, `/profiles/resend-verification`
  (`ApiError.isEmailNotVerified`).
