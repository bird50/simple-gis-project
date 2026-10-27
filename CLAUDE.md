@AGENTS.md

# CLAUDE.md — simple_gis_webapp (ThaiWater GIS)

`AGENTS.md` (imported above) holds the project rules. This file adds what is specific to working with the sibling Toolbox projects.

## Three sibling projects

```
bird_dev/
├─ simple_gis_webapp   this repo (GitHub bird50/simple-gis-project, work branch test1)
├─ toolbox_sdk         @thaiwater/toolbox-sdk — tools, runtime, adapters (own repo and CLAUDE.md)
└─ toolbox_service     SQLite service for Public photos/drawings (own repo and CLAUDE.md)
```

- The web installs the SDK as `file:../toolbox_sdk` with `install-links=true` (`.npmrc`): a copy, not a symlink. After changing the SDK, rebuild it and reinstall here. npm skips reinstalling when the version is unchanged, so remove the copy first:
  `rm -rf node_modules/@thaiwater/toolbox-sdk && npm install ../toolbox_sdk --install-links`, then restart `npm run dev`. If the dev server was running during the reinstall and SDK UI shows unstyled (Tailwind `@source` read the missing copy), stop dev, delete `.next/dev` and start it again.
- Import the SDK only through its public entries: `@thaiwater/toolbox-sdk`, `/react/core` (shared runtime; `/react` is the deprecated all-in-one), `/maplibre`, `/storage`, `/core/{drawing,data-files,photo-gps}`, `/tools/{photo,draw,data-files,navigation}`. Deep paths (`/ui/...`, `/adapters/...`) are not exported.
- Never edit tool code here. Tool UI, text and storage live in the SDK; change them there.

## How the Toolbox is wired

- `config/toolboxes.tsx` — `toolPlugins` (module-level constant, Toolbox order), each imported from its `/tools/*` entry. Tool IDs keep the old `thaiwater.*` names.
- `config/layers.ts` — system layers only. Tool layers are registered by plugins with `owner.toolId`; never add a tool layer ID here (the tool would refuse to mount).
- `components/map/LayerDataSources.tsx` offers system layers to the SDK `DataPanel` (bottom Data Panel) via `useDataSource`; `components/map/useStations.ts` loads stations by map bbox and falls back to sample stations when PostGIS is down. Column headers come from `fieldLabels` in `config/layers.ts`.
- `components/map/GISMap.tsx` — `GISRoot` creates one registry per user (`key={user.id}`) and wraps the workspace in `ToolboxProvider` (`toolLayers="start"`). The sidebar reads `useLayers()`, shows settings via `useLayerSettings` and a − (Remove from map) button via `useLayerRemove`, and uses `layer.owner` for the orange accent/icons. `<ToolOverlays/>` sits inside `MapLibreToolboxBridge`; `<ToolDialogs/>` once.
- `lib/toolbox/runtime.ts` keeps the legacy IndexedDB names (`thaiwater-my-photos`, `thaiwater-my-drawing`, `thaiwater-data-files`). Changing them loses users' saved browser data.

## Gateway to toolbox_service

- `lib/toolbox/service.ts` `proxyToolbox` is the only path to the service: same-origin check (`sameOrigin` compares `Origin` with the Host / X-Forwarded-Host header, not `request.url`), publication rate limit, body size cap, owner headers, bearer key.
- Routes: `app/api/photo-shares`, `app/api/drawing-shares`, `app/api/data-file-shares`, `app/api/public/{photos,photo-shares,drawings,data-files}`, `app/api/photo-shares/[shareId]`, `app/api/photo-shares/[shareId]/photos/[photoId]`, page `app/share/[shareId]`. Public GETs forward only parameters validated by `lib/toolbox/public-query.ts`.
- Keys stay server-side (never `NEXT_PUBLIC_*`). `serviceKey()` picks `TOOLBOX_SERVICE_READ_KEY` (scope `read`) for GET and `TOOLBOX_SERVICE_KEY` (scopes `read,write`) for publishing; without a read key, reads use the write key. Both are issued by `npm run key:create` in toolbox_service (or the write key equals the service's legacy `.env` key). `TOOLBOX_SERVICE_KEY` also signs guest publisher cookies, so rotating it re-issues guest identities. Identity headers come from the gateway, never from the client.

## Auth mode and security

- `AUTH_ENABLED=false` in `lib/auth/mode.ts`: `/gis` is account-free (guest `guest-workspace-v1`), account/admin APIs return 503, publishing uses a signed guest cookie. `tests/auth-free-mode.test.ts` asserts this mode.
- With auth on: `getSession` re-reads role/status from the database each call; `lib/auth/secret.ts` refuses a weak `AUTH_SECRET` in production; last-active-admin rule lives in `lib/auth/admin-guard.ts` inside a serializable transaction. This path has unit tests only — verify against a real PostgreSQL before enabling.
- Rate limits (`lib/security/rate-limit.ts`) are in-memory per process and trust `X-Forwarded-For`; document any change in README.

## Commands

```bash
npm run dev                                   # http://localhost:3000/gis
npm run lint && npm run build                 # required before finishing (AGENTS.md)
node --import tsx --test tests/*.test.ts      # unit tests (no npm test script)
```

- Open the dev site via `localhost`. Through a LAN IP, HMR is blocked unless the IP is in `allowedDevOrigins` (`next.config.ts`) — don't commit machine IPs.
- `next build`/`next dev` rewrite `next-env.d.ts`; restore it (`git checkout -- next-env.d.ts`) instead of committing the dev variant. Delete stray `tsconfig.tsbuildinfo` after ad-hoc `tsc` runs.
- Public sharing needs `toolbox_service` running on 127.0.0.1:4010; private tools work without it.

## Known constraints

- `maplibre-gl` is 5.x and has an open critical advisory. Upgrading to 6 needs MapLibre's worker file served next to the bundle (see `toolbox_sdk/examples/react-maplibre/build.mjs`); test `/gis` after upgrading.
- Use `docs/toolbox-regression-checklist.md` for manual checks after SDK changes and append a result row.
- Keep README.md and `docs/webmap-extensions.md` in sync with Toolbox wiring changes.
