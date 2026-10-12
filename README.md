# نقشه و مسیریاب — Minimalist Map & Route Planner

A production-minded, full-screen interactive map application for **Iran**, built with React + TypeScript.
Users can search real places, pick an origin and destination, calculate **real road routes** (with
alternatives), and use the browser's geolocation — all inside a polished glassmorphism UI with a
Persian (RTL) interface.

> **Basemap:** key-less **OpenStreetMap** raster tiles (no map key needed).
> **Data (routes, details, steps):** [Neshan Maps Platform](https://platform.neshan.org) REST APIs —
> needs one web-service key (see [Environment configuration](#environment-configuration)). Without
> the key the map still renders, but routing/details show a typed «key missing» error (never faked).

---

## 1. Feature checklist (implemented)

| Requirement                                                                                        | Status                                                                                       |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Full-viewport interactive map (plain `maplibre-gl`, OpenStreetMap tiles — no map key)              | ✅                                                                                           |
| Real autocomplete search (debounced 350 ms, cached)                                                | ✅ free **iran-locations-api.ir** city dataset (key-less), optional Neshan street/POI search |
| Origin / destination selection, swap, clear, edit-after-routing                                    | ✅                                                                                           |
| Real road routing with provider geometry (no straight lines)                                       | ✅ `GET /v4/direction`                                                                       |
| Alternative routes (click a dashed line or use the chips)                                          | ✅ `alternative=true`                                                                        |
| Distance & travel time from the provider (Persian labels)                                          | ✅                                                                                           |
| Auto-fit viewport to route bounds / endpoints                                                      | ✅                                                                                           |
| Current-location button (browser Geolocation API + accuracy circle)                                | ✅                                                                                           |
| "Use current location as origin" in one action                                                     | ✅                                                                                           |
| Map controls: zoom in/out, reset view, fit endpoints, compass reset, light/dark styles             | ✅                                                                                           |
| Glassmorphism floating UI, responsive desktop/tablet/mobile grid                                   | ✅                                                                                           |
| Persian RTL UI, mixed-direction text (`dir="auto"`), localization-ready i18n                       | ✅                                                                                           |
| Login page with 3 pre-defined accounts (basic / standard / vip tiers)                              | ✅                                                                                           |
| Error states: missing keys, map load failure, network, quota, rate limit, no-route, geolocation    | ✅                                                                                           |
| Accessibility: combobox/listbox keyboard model, focus rings, ARIA labels, `prefers-reduced-motion` | ✅                                                                                           |
| `tsc --noEmit` (strict), ESLint, unit test, production build                                       | ✅ all passing                                                                               |

---

## 2. Provider research & selection (Phase 1 summary)

Evaluated options and official documentation (links in §5):

| Provider                                     | Tiles in Iran                                                                                                                               | Search/geocode                                                        | Routing                                                                   | React/TS fit                      | Verdict                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------- |
| **OpenStreetMap** (key-less)                 | ✅ plain OSM raster (`tile.openstreetmap.org`) for **both** themes — dark is the same tiles dimmed via raster paint, no second host, no key | ➖                                                                    | ❌                                                                        | ✅ inline `maplibre-gl` style     | **Selected** for the basemap (no key, no account, no token, proper attribution) |
| **Neshan** (OSM-based, Iranian)              | ➖ (not used for tiles)                                                                                                                     | ✅ `/v3/search`, `/v5/reverse`, geocoding                             | ✅ `/v4/direction` (live traffic, alternatives, distance/duration, steps) | ✅ plain REST + fetch             | **Selected** for routing + details + steps (+ optional street search)           |
| **iran-locations-api.ir** (open-source)      | ➖                                                                                                                                          | ✅ 344 Iranian cities with coordinates — **free, key-less, CORS `*`** | ❌                                                                        | ✅ plain JSON, trivial to consume | **Selected** as the default search backend                                      |
| Map.ir                                       | jQuery-era `$.sMap` SDK (docs last updated 2019)                                                                                            | ✅                                                                    | ✅                                                                        | ❌ no modern React/MapLibre path  | Rejected                                                                        |
| Self-hosted OSM tiles (TileServer/Protomaps) | Requires own hosting/infrastructure                                                                                                         | ❌                                                                    | ❌ (needs OSRM/Valhalla hosting)                                          | ➖                                | Rejected for an initial project                                                 |
| Mapbox                                       | ✅                                                                                                                                          | ✅                                                                    | ✅                                                                        | ✅                                | Rejected: US sanctions/pricing risk for Iranian apps, higher cost               |
| Public Nominatim                             | ➖                                                                                                                                          | ❌ usage policy **prohibits** client-side autocomplete                | ❌                                                                        | ➖                                | Rejected (explicitly forbidden pattern)                                         |

**Verified facts (not assumptions):**

- CORS: `OPTIONS https://api.neshan.org/v3/search` from `http://localhost:5173` returns
  `access-control-allow-origin: <reflected origin>` and `access-control-allow-headers: … api-key …`
  → browser-side calls with an `Api-Key` header are supported without a proxy.
- Error semantics: invalid key → HTTP `480 KeyNotFound` (also documented `481 LimitExceeded`,
  `482 RateExceeded`, `483/485 ApiKey…`, mapped to typed app errors).
- **The basemap is 100 % OpenStreetMap and needs no key at all.** Both themes are an inline
  MapLibre `StyleSpecification` whose only raster source is
  `https://tile.openstreetmap.org/{z}/{x}/{y}.png` — verified live: `HTTP 200 image/png` with no
  query parameters. The dark theme reuses _those same tiles_, dimmed and desaturated through
  `raster-brightness-min/max`, `raster-saturation` and `raster-contrast`, so the app never
  contacts a second tile host. **No CARTO** (`basemaps.cartocdn.com` now demands `?key=` on every
  request), **no OpenFreeMap style host, no Mapbox, no Neshan map SDK** — `maplibre-gl` is
  open-source (BSD-3) and reads the OSM tile server directly. The theme toggle just re-applies
  `styleFor(theme)`; `scripts/styles.test.ts` fails the build if a key parameter or a key-gated
  vendor host ever creeps back into the style.
- Direction response shape (docs): `routes[].overview_polyline.points` + `legs[].steps[].polyline`
  (Encoded Polyline, precision 5) and per-leg/step `distance`/`duration` as `{value, text}` with
  Persian labels — used verbatim; totals fall back to summing the provider's own leg values.
- **Cities API** (`GET https://www.iran-locations-api.ir/api/v1/fa/cities`): verified live —
  `Access-Control-Allow-Origin: *`, no key, no published rate limit; 344 records of
  `{name, latitude, longitude}` (~22 KB). Two data quirks are handled in
  `src/providers/iranLocations/transform.ts`: **~30 records ship `latitude`/`longitude` swapped**
  (detected because Iranian latitude is always smaller than longitude, then corrected; anything
  still outside Iran's bounds is dropped) and a few **exact duplicate rows** are de-duplicated.
  Matching is Persian-normalized (Arabic ي/ك → ی/ک, alef folding, ZWNJ/diacritics) so typed
  «تبریز» matches the dataset's «تبريز», and compact spellings like «محموداباد» still match.

**Cost model:** the basemap and the default search backend cost nothing (OSM tiles + open-source
cities API). Neshan data APIs (routing/details/steps, optional street search) are pay-as-you-go
and grant new accounts a free development credit (200,000 Toman for 3 months, per their FAQ). There
is **no free unlimited tier** for routing, therefore route calculation requires your own key — but
the map itself always renders.

---

## 3. Technology stack

- **Vite 8** + **React 19** + **TypeScript ~6** (`strict: true`, `erasableSyntaxOnly`)
- **TanStack React Query v5** — server state, caching, cancellation, retry policy
- **MapLibre GL JS** (plain `maplibre-gl` + key-less OSM raster tiles)
- **Tailwind CSS v4** (`@tailwindcss/vite`) + custom glassmorphism layer
- **Motion** (`motion/react`) for dropdown/panel/summary animations (reduced-motion aware)
- **Lucide React** icons
- ESLint 10 (typescript-eslint + react-hooks flat configs), Node's built-in test runner

---

## 4. Architecture

```
src/
├── App.tsx                    # providers + full-screen shell (grid overlay)
├── main.tsx                   # entry (SDK css + index.css)
├── index.css                  # Tailwind v4 + glassmorphism + RTL overlay grid
├── queryClient.ts             # TanStack Query defaults (retry policy per error type)
├── config/env.ts              # VITE_* access (map key / API key / style overrides)
├── i18n/                      # flat Persian catalog + typed t() (English fallback ready)
│   ├── fa.ts                  #   all UI strings (MessageKey)
│   └── index.tsx              #   I18nProvider / useT
├── access/                    # login auth: users.ts (3 demo accounts), AccessContext, Gate
│   ├── users.ts               #   LOCAL_ACCOUNTS + authenticate()
│   ├── source.ts              #   localStorage session persistence (swap for JWT later)
│   ├── model.ts               #   level → capability matrix (who can see what)
│   ├── AccessContext.tsx      #   login()/logout()/can()
│   └── Gate.tsx               #   capability-gated rendering
├── types/                     # provider-agnostic domain models
│   ├── geo.ts  search.ts  route.ts  provider.ts
├── providers/                 # pluggable service layer (swap vendors in one file)
│   ├── registry.ts            # picks backends from env + exposes availability flags
│   ├── iranLocations/         # default search: free cities API (unit-tested transform)
│   └── neshan/                # Neshan adapters: routing, reverse, optional street search
├── services/
│   ├── polyline.ts            # Encoded-Polyline decoder (unit-tested)
│   └── geolocation.ts         # browser Geolocation -> typed fixes/errors
├── hooks/
│   ├── useSearchQuery.ts      # debounced/cancellable/cached autocomplete
│   ├── useRouteQuery.ts       # route calculation keyed by coordinates
│   ├── useDebouncedValue.ts  useClickOutside.ts
├── map/
│   ├── MapContext.tsx         # map store (instance, ready, styleVersion, errors, reload)
│   ├── styles.ts              # key-less OpenStreetMap basemap styles (light/dark paint)
│   ├── routeLayers.ts         # idempotent GeoJSON route sources/layers
│   └── waitForStyleLoaded.ts  # style-swap synchronization
├── state/PlannerContext.tsx   # origin, destination, route index, theme, geolocation
├── utils/                     # cn, formatting (Persian digits), errors, geo math
└── components/
    ├── MapView.tsx                # map lifecycle + theme switching + error reporting
    ├── SearchPanel.tsx            # floating glass panel (upper-right)
    ├── LocationSearchInput.tsx    # ARIA combobox (debounce, keyboard, clear)
    ├── SearchResultsDropdown.tsx  # listbox popup (loading/empty/error states)
    ├── MapControls.tsx            # zoom / reset / fit / compass / theme (upper-left)
    ├── CurrentLocationButton.tsx  # geolocation + accuracy + "use as origin" (bottom-right)
    ├── RouteLayer.tsx             # draws route, fits bounds, alternative clicks
    ├── RouteSummary.tsx           # distance/time/alternatives card (bottom-left)
    ├── EndpointMarkers.tsx        # origin/destination badges
    ├── UserLocationLayer.tsx      # pulsing marker + accuracy circle
    ├── StatusOverlay.tsx          # missing-key / loading / map-error states
    ├── LoginPage.tsx              # login gate (3 pre-defined accounts)
    ├── UserBadge.tsx              # username + tier + logout (top-center)
    └── ui/IconButton.tsx
```

Key design decisions:

- **Provider abstraction** — `SearchProvider` / `RoutingProvider` / `ReverseGeocodingProvider`
  interfaces in `types/provider.ts`; the UI only sees `MapServices` from `providers/registry.ts`.
  Replacing Neshan (or proxying through a backend) is a registry change only.
- **Server state** — React Query owns search & route queries: keys `['place-search', term]` and
  `['route', [lng,lat], [lng,lat], mode]`; React Query passes an `AbortSignal` so obsolete requests
  are cancelled; stale routes disappear automatically because the query is disabled until both
  endpoints exist.
- **Map state** — the MapLibre instance lives in `MapContext`; `styleVersion` bumps after each
  basemap swap so route/accuracy layers are re-created idempotently.
- **Local state** — dropdown open/highlight, popover visibility and transient UI stay local.
- **Access control** — the login page validates against 3 hard-coded accounts in
  `src/access/users.ts` (`user-basic` / `user-standard` / `user-vip`, all password
  `1234`). Each account maps to a tier; the tier maps to capabilities in
  `src/access/model.ts`: every tier sees map + search + route summary +
  origin/destination details; standard adds controls + location; only vip sees
  the turn-by-turn legs/steps. Components only call `can(...)` / `<Gate>`; the
  session persists in localStorage. Logout wipes everything — origin,
  destination, selected route, geolocation, route/search caches and trip URL
  params — and returns to the login page.
- **Travel profiles** — `TravelMode = 'driving' | 'motorcycle'` maps to Neshan's `type=car|motorcycle`.
  Walking/cycling can be added behind the same `RoutingProvider` when their endpoints are integrated.

---

## 5. Setup

```bash
npm install
cp .env.example .env      # then fill in your Neshan web-service key (routing/data)
npm run dev               # http://localhost:5173
```

> The map renders with no key (OpenStreetMap). Only routing/route-details need
> `VITE_NESHAN_API_KEY`.

Verification scripts:

```bash
npm run typecheck   # tsc -b (strict)
npm run lint        # eslint .
npm test            # unit tests (polyline decoder + cities search)
npm run build       # typecheck + vite build -> dist/
npm run preview     # serve the production build
```

### Environment configuration

| Variable               | Purpose                                                                                                                                                 | Secret?                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `VITE_NESHAN_API_KEY`  | Routing + reverse geocoding + optional Neshan search (`Api-Key` header). `VITE_NESHAN_MAP_KEY` kept as a legacy alias                                   | Public — restrict by domain in the Neshan panel |
| `VITE_SEARCH_PROVIDER` | `cities` (default, **no key needed**) or `neshan` (street/POI search; needs the API key + activated Search service, falls back to `cities` without one) | Public                                          |

All `VITE_*` values are embedded in the client bundle and **must never be confidential**. If a
future provider requires a secret key, add a small backend proxy — do not put secrets in `.env`.

### API registration (Neshan data APIs) — official docs

1. Sign up (free): <https://platform.neshan.org> → developer panel.
2. Create a **web-service** key: <https://platform.neshan.org/API/> — used for direction
   (routing/steps), reverse geocoding and optional street search. The basemap needs no key.
3. In the key settings add your allowed domains («دامنه/IP های مجاز»), e.g. `localhost` and your
   production origin — this is the recommended client-side protection.
4. Copy `.env.example` → `.env`, paste the value into `VITE_NESHAN_API_KEY`, restart the dev server.
5. Optional — only for `VITE_SEARCH_PROVIDER=neshan`: the Search service may require activation via
   a support ticket (noted in its docs). The default `cities` search backend needs **no key at all**.

Documentation links:

- **Basemap tiles**: OpenStreetMap only — https://www.openstreetmap.org/copyright (© OpenStreetMap
  contributors, ODbL). Light theme = the standard tiles as-is; dark theme = the _same_ tiles dimmed
  and desaturated client-side by MapLibre raster paint properties. Nothing else is requested.
- **Cities API (default search)**: https://www.iran-locations-api.ir
- Platform overview & error codes: https://platform.neshan.org/API/
- Pricing (pay-as-you-go + free dev credit): https://platform.neshan.org/Pricing/
- Search API (`/v3/search`): https://platform.neshan.org/docs/api/search-category/search/
- Direction API (`/v4/direction`): https://platform.neshan.org/docs/api/routing-category/routing/
- Reverse API (`/v5/reverse`): https://platform.neshan.org/docs/api/search-category/reverse-geocoding/
- Geocoding API: https://platform.neshan.org/docs/api/search-category/geocoding/

---

## 6. Security, geolocation & attribution notes

- No credentials are committed; `.env` is git-ignored and `.env.example` contains placeholders only.
- Keys are **public by design** (Vite `VITE_*`); mitigate abuse with Neshan's domain whitelist plus
  the provider's per-minute rate limits (HTTP 482) and monthly quotas (HTTP 481). Provider errors
  are normalized to typed codes (`invalid_api_key`, `quota_exceeded`, `rate_limited`, …) and mapped
  to friendly Persian messages; retrying is limited to transient network failures so quota is not
  burned on permanent errors.
- **Geolocation requires a secure context**: browsers expose `navigator.geolocation` only on
  `https://` or `localhost`. Permission denial, unavailable fixes, timeouts, unsupported browsers
  and insecure origins are each handled with a distinct Persian message, and success is reported
  only after a genuine position fix (plus an accuracy circle and best-effort reverse geocode).
- **Attribution**: the OSM raster style carries the legally required ©OpenStreetMap contributors
  attribution on the map for both themes; the floating overlay reserves a bottom strip so it
  stays visible, and the route card credits both the basemap and the Neshan routing service.
- **RTL/Persian text**: the document is `lang="fa" dir="rtl"`, the styles are authored RTL-aware,
  and mixed Persian/English names render correctly via `dir="auto"` on inputs and result rows.
- **No credentials are required for the map**: the basemap never asks for a key, so the app is
  fully usable (browse, zoom, pan, both themes, search by city) with an empty `.env`. Only the
  Neshan _data_ endpoints (routing/details/reverse) need `VITE_NESHAN_API_KEY`.

---

## 7. What still requires external credentials / infrastructure

Honest status of this repository — nothing below is claimed to work without the listed setup:

1. **Routing/details need a Neshan web-service key** (`VITE_NESHAN_API_KEY`). The map
   itself renders with no key (OpenStreetMap). Without the API key the route card shows a
   typed «key missing» error — it never returns fake results or simulated routes.
   **Location search works without any key** (free city dataset).
2. **Street/POI-level search** (optional): the default backend is city-level. Setting
   `VITE_SEARCH_PROVIDER=neshan` switches to Neshan's street/POI autocomplete, which needs an API
   key **and** activation of the Search service (support ticket per their docs); without a key it
   falls back to `cities` automatically.
3. **Quota/pricing**: consumption follows Neshan's pay-as-you-go pricing (free development credit
   for new accounts). Heavy production traffic needs a charged account (and ideally a backend
   proxy + caching layer).
4. **HTTPS hosting** is required for production geolocation (localhost is fine in development).
5. **Walking/cycling profiles**: driving is fully wired (plus the provider's motorcycle profile
   through the same endpoint); pedestrian/bicycle endpoints exist at Neshan but are not integrated.

Everything else — full-screen map, glassmorphism UI, autocomplete search UX, real routing with
alternatives and viewport fitting, geolocation, map controls, Persian RTL i18n, accessibility,
error handling, typecheck, lint, tests and production build — is implemented in this repository
and verified with the commands in §5.
