# react_movix

Frontend web (SPA) de Movix, plateforme de gestion de livraisons pharmaceutiques.
Ce front remplace en place `vue_movix` et s'appuie sur l'API REST Spring Boot `api_movix`.

Stack : React 19, TypeScript, Vite 6, Tailwind CSS v4, shadcn/ui, TanStack Query,
React Router v7, i18next, Mapbox GL.

## Prerequis

- Node.js 20 ou plus recent et npm
- Un fichier `.env.<mode>` par environnement (voir ci-dessous)

## Demarrage

```bash
npm install
cp .env.example .env.development
npm run dev
```

`npm run dev:https` lance le serveur de dev en HTTPS (certificat auto-signe).

## Scripts

| Commande | Description |
| --- | --- |
| `npm run dev` | Serveur de developpement Vite |
| `npm run build` | Build de production (`tsc -b && vite build --mode production`) |
| `npm run build:beta` / `build:demo` / `build:prod` | Build par environnement |
| `npm run lint` | ESLint |
| `npm run preview` | Previsualisation du build |

## Environnements

Un fichier `.env.<mode>` par environnement (`development`, `beta`, `demo`, `production`),
jamais commite. Le modele est `.env.example`. Variables :

| Variable | Role |
| --- | --- |
| `VITE_APP_ENV` | `dev`, `beta`, `demo` ou `prod` |
| `VITE_API_BASE_URL` | URL de l'API `api_movix` (sans prefixe `/api`) |
| `VITE_MAPBOX_TOKEN` | Token public Mapbox (`pk.*`, restreint par domaine) |
| `VITE_ORS_BASE_URL` | URL de l'API spring-org (routing, optimisation, geocodage) |

La configuration se lit exclusivement via `src/lib/config.ts`.

## Deploiement

```bash
pip install -r deploy/requirements.txt
cp deploy/.env.example deploy/.env   # renseigner les identifiants SSH
python deploy/deploy.py
```

Le script propose l'environnement, incremente la version de `package.json`, construit
avec le bon mode Vite, sauvegarde le site distant, envoie `dist/` et verifie que
`https://<url>/version.json` sert la nouvelle version.

## Structure

```
src/
  app/        contexte auth, gardes de routes, notifications
  components/ composants UI (shadcn) et composants metier
  features/   couche API par domaine (types, keys, api, queries)
  i18n/       locales EN / FR
  layouts/    AuthLayout (public) et AppLayout (protege)
  lib/        client HTTP, config, auth, utilitaires
  pages/      pages routees
deploy/       script de deploiement
```

Les conventions detaillees (architecture, contrat API, regles UI et mobile) sont dans
`CLAUDE.md`.
