# Feature source cache and HTTP validators

`@mapsight/core` can optionally cache **xhr-json** feature documents (typically GeoJSON
over HTTP) and revalidate them with conditional requests. The cache is **opt-in**:
without an injected adapter, loads use today’s direct fetch path.

This note covers the client contract and the host/proxy headers that make 304
responses useful for scheduled GeoJSON publishers (including mapsight-pulp
outputs). For pulp deployment shape, see [PULP.md](PULP.md).

---

## Opt-in via `create()` / store extra argument

Pass a `FeatureSourceCache` implementation through UI `createOptions` (forwarded
into the Redux store extra argument):

```ts
import {create} from "@mapsight/ui";

import {createMemoryFeatureSourceCache} from "@mapsight/core/lib/feature-sources/cache";

const featureSourceCache = createMemoryFeatureSourceCache();

create(container, styleFunction, config, {
	featureSourceCache,
	/** Optional revision token included in document cache keys. */
	featureSourceRevision: appVersion,
	/** Optional clamp for persist / freshness (ms). */
	featureSourceCacheTtl: {
		minMs: 10_000,
		defaultMs: 5 * 60 * 1000,
		maxMs: 60 * 60 * 1000,
	},
});
```

| Option                      | Role                                                                                                                                                                                                        |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `featureSourceCache`        | Adapter (`get` / `put` / `delete` / byte estimate / LRU). Memory today; IndexedDB later in the browser.                                                                                                     |
| `featureSourceRevision`     | Shared revision (`appVersion` / publish id) folded into document keys so a deploy invalidates old bodies.                                                                                                   |
| `featureSourceCacheTtl`     | Clamp: skip persist when origin lifetime is shorter than `minMs`; default freshness when `max-age` / `Expires` are absent; never treat stored docs as fresh longer than `maxMs`. Defaults: 10s / 5min / 1h. |
| `sharedCache` (store extra) | Shared-cache freshness (`s-maxage`, `proxy-revalidate`). Defaults to `true` when `window` is undefined (SSR sidecar).                                                                                       |

Helpers live under `@mapsight/core/lib/feature-sources/cache`:

- `createMemoryFeatureSourceCache()` — process / tab memory adapter
- `warmFeatureSourceUrl(cache, url, revision?)` — prefetch through the same flight slot as `load()`
- `purgeDocumentCacheEntries(cache, urls?)` — drop stored documents (omit `urls` to clear all). Used by SSR publish hooks so the next render cannot dehydrate a pre-publish body.

Missing `featureSourceCache` means no document cache and no `If-None-Match` from a prior entry.

---

## Conditional fetch (`If-None-Match` / `ETag`)

`fetchXhrJson` in `@mapsight/core` sends conditional headers when a cached entry
has validators **and** the request is same-origin (or non-browser):

- `If-None-Match` ← stored `ETag`
- `If-Modified-Since` ← stored `Last-Modified` (supported if the host sends it; see host contract below)

On **304 Not Modified**, the loader skips `JSON.parse` and reuses the cached body
(updating freshness metadata). A 304 without having sent a conditional header is
treated as an error.

Cross-origin browser fetches do not attach conditional headers (CORS
`Access-Control-Expose-Headers` / credential constraints); prefer same-origin
GeoJSON URLs for polling.

---

## Host contract for features-stable 304s

Mapsight’s document cache is only as good as the **origin ETag**. For scheduled
rewrites that bump metadata inside the GeoJSON (for example a build timestamp)
while **features** are unchanged:

1. **Hash features only** for the validator — not the whole file and not
   metadata-only fields that change every rewrite.
2. Serve a **weak ETag** such as `W/"<hex>"` derived from that features digest
   (a sidecar file the web server can map onto `ETag` without parsing JSON is
   fine).
3. Send **`Cache-Control: no-cache`** (or `must-revalidate`) so clients
   revalidate on each poll and can receive 304 when features are unchanged.
   `no-cache` is stored and revalidated by the Mapsight cache; it is not
   `no-store`.
4. **Proxies must forward** `If-None-Match` and `ETag` end-to-end.
5. **Do not rely on `Last-Modified` / file mtime** to fake freshness — rewriting
   the file updates mtime even when features are identical. Prefer the
   features-stable ETag; Mapsight may still send `If-Modified-Since` if a
   `Last-Modified` was previously stored, but hosts should not depend on it for
   this case.

Disable automatic strong file ETags based on inode/mtime/size for these URLs so
they do not fight the features-stable weak ETag.

A **200** response still requires parsing the body. Unchanged features with a
correct features-stable ETag should 304 instead.

---

## Freshness clamp and purge

- Responses with `no-store` (or `private` on a shared cache) are not persisted.
- Origin lifetimes shorter than `featureSourceCacheTtl.minMs` are not persisted.
- `purgeDocumentCacheEntries` bumps a write generation so in-flight warms cannot
  put a stale body back after purge.

---

## Related

- [PULP.md](PULP.md) — scheduled GeoJSON writers
- [CONFIG_REFERENCE.md](CONFIG_REFERENCE.md) — `featureSources` in embed config
- [SSR_HYDRATION.md](SSR_HYDRATION.md) — dehydrated state and sidecar warm/purge
- [`@mapsight/core` Redux architecture](../../packages/core/docs/REDUX_ARCHITECTURE.md)
