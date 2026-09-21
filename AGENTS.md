# Repository Guide

## Setup and local development

- Use Node.js 20+ and the committed `package-lock.json`; install with `npm ci`.
- Put `COPERNICUS_CLIENT_ID` and `COPERNICUS_CLIENT_SECRET` in the gitignored `.dev.vars`.
- Initialize the local D1 database with `npx wrangler d1 migrations apply taliabu-db --local --config wrangler.dev.jsonc`.
- Run both services with `make dev`, or separately with `npm run dev:worker` (port 8787) and `npm run dev` (port 5173). Vite proxies `/api` to the Worker.
- Use `wrangler.dev.jsonc` for local work. `wrangler.jsonc` is production configuration and binds the remote D1 database.

## Verification

- There is no configured lint or automated test suite. Do not claim `npm test` or a single-test command exists.
- Run the focused change-detection self-check with `node --experimental-strip-types scripts/check-change-detection.ts`.
- Run checks in this order: `npx vue-tsc --noEmit`, `npm run build`, then `npx wrangler deploy --dry-run` when Worker code or configuration changed.
- Vite does not typecheck, and `tsconfig.json` includes only `src/`, not `worker/`; the Wrangler dry run is the available Worker bundle check.

## Architecture

- `src/main.ts` mounts the Vue SPA; `/` resolves to `src/features/environmental-map/EnvironmentalMapPage.vue`. That page coordinates map UI, while its `components/`, `composables/`, and `layers/` hold behavior and layer definitions.
- `worker/index.ts` is the Hono/Cloudflare entrypoint for API routes, static-asset handling, and the scheduled scene refresh. Provider calls belong in `worker/services/`; D1 access belongs in Worker routes/helpers, never in the browser.
- D1 stores metadata, analysis runs, and alerts only. Do not store raster imagery there or perform large raster decoding, reprojection, or matrix work in the Worker; delegate raster processing to Copernicus and keep lightweight vector analysis in Turf/browser code.
- Runtime reference layers live under `public/data/`. Terrain scripts generate artifacts there; `scripts/sync-reference-data.ts` can overwrite authoritative GeoJSON snapshots and must preserve source/retrieval metadata.
- The custom Vite plugin emits and serves MapLibre worker assets. Do not remove it merely because its imports appear build-specific.

## Product and operational constraints

- Treat NDVI, MNDWI, NDTI, and change detection as remote-sensing proxies, not proof of pollution, chemical composition, or illegal mining. Keep source, acquisition date, method, cloud-quality context, and uncertainty visible.
- For UI changes, follow `docs/DESIGN-SYSTEM.md`: map-first layout, fixed semantic layer colors, alert red only for real alerts/errors/destructive actions, and monospace only for literal data.
- Local frontend requests use relative `/api`; production builds require `VITE_API_ORIGIN`. Production routing deliberately separates the main host from the API host and returns JSON/HTTP 404s for invalid paths instead of an SPA-shell 200; preserve this security behavior in `worker/index.ts`.
- `npm run deploy` builds and deploys, but does not typecheck or apply migrations. Apply new migrations separately before code that depends on them.
- Never run remote D1 migrations, deploy, `wrangler secret put`, or `terraform apply` without explicit authorization. Terraform state is intentionally local to one trusted workspace; do not create competing state or parallel applies.
