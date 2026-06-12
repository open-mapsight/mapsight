# @mapsight/count-aggregator-api

Typed HTTP client, Zod schemas, and OpenAPI contract for the Mapsight **count-aggregator** public API — station metadata and aggregated count time series (bicycle counters, traffic sensors, and other station types).

Pair with [`@mapsight/count-aggregator-ui`](../count-aggregator-ui/README.md) for an embeddable React wizard and charts, or use this package alone in your own UI.

## Install

**npm** (when published):

```bash
npm install @mapsight/count-aggregator-api
```

**pnpm workspace** (monorepo):

```bash
pnpm --filter @mapsight/count-aggregator-api build
```

## Quick start

Create a client pointed at your tenant’s public count-aggregator base URL, then call generated endpoint aliases. Typed helper wrappers are planned ([Phase 3](./PLAN.md#phase-3--client-ergonomics--dry)); until then, use bracket notation:

```ts
import {
	createCountAggregatorClient,
	schemas,
} from "@mapsight/count-aggregator-api";

const baseUrl = "https://<tenant>.example.tld/msp/public/count-aggregator";
const client = createCountAggregatorClient(baseUrl);

// List stations for a type
const stationList = schemas.StationListResponse.parse(
	await client["count-aggregator.public.type.stations"]({
		params: {type: "bicycleCount"},
	}),
);

// Aggregated values for one or more stations
const valuesMap = await client["count-aggregator.public.type.values"]({
	params: {
		type: "bicycleCount",
		from: "2025-06-01",
		to: "2025-06-07",
		resolution: "daily",
	},
	queries: {
		stationIds: "150",
	},
});
```

Inject a custom `fetch` (tests, SSR, proxies):

```ts
const client = createCountAggregatorClient(baseUrl, {
	fetch: myFetch,
});
```

## Scripts

From this package directory (or via `pnpm --filter @mapsight/count-aggregator-api <script>`):

| Script              | Purpose                                                            |
| ------------------- | ------------------------------------------------------------------ |
| `pnpm generate`     | Regenerate `src/generated/client.ts` from the bundled OpenAPI spec |
| `pnpm build`        | `generate` + `tsc` → `dist/`                                       |
| `pnpm test`         | Unit tests (mocked fetch, contract, URL builders)                  |
| `pnpm test:smoke`   | Opt-in live API smoke tests (needs env, see below)                 |
| `pnpm sync-openapi` | Download live OpenAPI JSON into `openapi/` (maintainers)           |
| `pnpm typecheck`    | Library + test TypeScript check                                    |

Copy [`.env.example`](./.env.example) to `.env` for `sync-openapi` and smoke tests — **not** required for build or unit tests.

```bash
# Live smoke (optional)
SMOKE_COUNT_AGGREGATOR_API=1 COUNT_AGGREGATOR_API_BASE=https://<tenant>.example.tld/msp/public/count-aggregator pnpm test:smoke
```

## Exports

| Export                                        | Description                                          |
| --------------------------------------------- | ---------------------------------------------------- |
| `createCountAggregatorClient`                 | JSON fetch client bound to OpenAPI operations        |
| `endpoints`, `schemas`                        | Generated operation map and Zod parsers              |
| `buildCsvExportUrl`, `buildStationsUrl`, …    | URL builders for CSV and direct links                |
| `parseLocalDateTime`, `parseTimeSeriesMap`, … | Response and datetime helpers                        |
| Types                                         | `StationType`, `Resolution`, `TimeSeriesResponse`, … |

Subpath: `@mapsight/count-aggregator-api/openapi.json` — committed contract used by codegen.

## OpenAPI contract

- Bundled spec: [`openapi/count-aggregator.openapi.json`](./openapi/count-aggregator.openapi.json)
- Sync from a live tenant: `pnpm sync-openapi` with `COUNT_AGGREGATOR_OPENAPI_URL` in `.env`
- Legacy `/wheel-counter/*` alias routes are **excluded** from the monorepo client contract

Regenerate the client after spec changes:

```bash
pnpm generate
```

Do **not** hand-edit `src/generated/client.ts`.

## CSV vs JSON

The fetch client is for **JSON** responses. For CSV downloads, build URLs with the helpers and open or download them in the browser — do not route CSV through `createCountAggregatorClient`:

```ts
import {buildCsvExportUrl} from "@mapsight/count-aggregator-api";

const href = buildCsvExportUrl(baseUrl, {
	type: "bicycleCount",
	from: "2025-06-01",
	to: "2025-06-07",
	resolution: "daily",
	stationIds: [150],
});
// <a href={href} download>…</a>
```

## Live API (placeholder)

Public SaaS documentation is not available yet. When you have a Mapsight tenant, endpoints follow this pattern:

| Resource         | URL pattern                                                |
| ---------------- | ---------------------------------------------------------- |
| API base         | `https://<tenant>.example.tld/msp/public/count-aggregator` |
| OpenAPI JSON     | `…/openapi.json`                                           |
| Interactive docs | `…/docs`                                                   |

Replace `<tenant>.example.tld` with your deployment host. A runnable local demo with mocked responses is planned in [Phase 1b](./PLAN.md#phase-1b--reference-demo-mock-api).

## Architecture

```
openapi/count-aggregator.openapi.json   ← contract (committed)
scripts/generate.ts                     ← openapi-zod-client
src/generated/client.ts                 ← generated (do not edit)
src/client.ts, src/lib/*                ← hand-written client + helpers
```

## Related packages

- [`@mapsight/count-aggregator-ui`](../count-aggregator-ui/README.md) — React wizard, charts, and embed wrapper
- [Improvement plan](./PLAN.md) — phased roadmap for both packages
