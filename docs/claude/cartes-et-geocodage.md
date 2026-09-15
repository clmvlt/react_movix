# Cartes Mapbox et API spring-org

Detail extrait de CLAUDE.md. A lire avant de modifier ce domaine.

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
