# Theme clair / sombre et champs date

Detail extrait de CLAUDE.md. A lire avant de modifier ce domaine.

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
