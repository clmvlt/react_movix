# Administration des entreprises (hyperadmin)

Detail extrait de CLAUDE.md. A lire avant de modifier ce domaine.

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
  Le dialog exige de RETAPER le nom exact de l'entreprise, montre les volumes detruits (dont
  `pharmacies`, les pharmacies du compte, supprimees AVEC l'entreprise depuis la migration V20)
  et rappelle ce qui survit (les comptes utilisateurs, qui perdent seulement leur appartenance).
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
