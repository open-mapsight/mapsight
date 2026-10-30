# Intent-driven preparation

Status: strategy proposal backed by an icon experiment. No automatic hover
prefetcher or general preload framework is enabled by this PR.

## Recommendation

Coordinate preparation across routes, lists, layers, and icons, while keeping
fetching, caching, and activation in their existing owners. Start with one host
adapter for one likely destination. Expand only when end-to-end measurements
show a benefit.

The shared policy decides **what is likely, when work can start, and how much is
allowed**. It should not introduce another GeoJSON loader, another router, or
another copy of cached feature data.

## Existing seams

- `warmFeatureSourceUrl(cache, url, revision, options)` prepares an `xhr-json`
  document without dispatching active feature-source state. Normal `load()` can
  join the same flight and consume the same cache. Both callers must use the
  **same adapter, resolved URL, revision, shared/private policy, and TTL policy**.
  Inject that adapter into browser `createOptions` as well as the intent adapter;
  having an SSR cache alone does not warm browser demand loads.
  Its boolean result means an entry is stored, not that it can be used without
  revalidation: `no-cache`/expired entries still follow the normal load policy.
- Document cache entries honor HTTP freshness, validators, revision keys, and
  purge generations. Reuse that contract; see [feature sources](FEATURE_SOURCES.md).
  A cache adapter must be scoped appropriately for its user/project context.
- Map icons already have a raster cache, keyed by compact id and variant.
  OpenLayers has a separate image cache: preparing the PNG data URL alone does
  not finish preparing the image the map will draw.
- Composable list icons already have synchronous SVG sources. Bare legacy signs
  use individual PNG URLs. Neither requires speculative map rasterization merely
  because a list row might be shown.
- SSR `renderAsync` can await required list/selected-detail sources without a
  browser DOM. Server document warming and browser image preparation are
  different operations.

## Plan the destination without activating it

Resolve the validated destination using the same rules as real navigation:

- Visible layers, current zoom/extent where relevant, and the active list source.
- Explicitly selected/permalink feature provenance and any required detail data.
- Recursive source dependencies, including combined-source members and host
  derivations. Prefetch leaf documents; build combined snapshots from current
  members on demand.
- Exact compact icon ids, colors, variants, and required pictogram packs.
- Actual lazy code boundaries, if the application has them.

Canonicalize meaningful query parameters too. A router with one pathname and
query-driven modules does not automatically gain data prefetching from link
intent: route loaders or a host intent adapter must resolve those dependencies.
Avoid activating a module to discover what it would load.

A speculative plan must not reset the store, select a feature, toggle a layer,
start layer refresh timers, build an OpenLayers feature source, emit navigation
analytics, or change the URL. In particular, dispatching ordinary `load()` on
hover is not equivalent to cache-only warming: it changes loading/error state
and can start refresh work. A speculative failure must not poison a later
foreground load.

## Priority and scope

| Situation                  | Work to prepare                                                                     | Work to defer                                                                  |
| -------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| SSR request                | Current list/details data needed for useful HTML; ordinary icon markup              | DOM/canvas rasterization, hidden modules, speculative waits that increase TTFB |
| Hydration                  | Reuse hydrated state; identify current map/list needs                               | Duplicate source fetches and low-priority work competing with hydration        |
| Visible map                | Unique effective icon ids for the current variant; selected/highlighted items first | Entire icon catalog and every size variant                                     |
| Visible list               | Required source/page and a small look-ahead window                                  | Map-only rasters or an entire long list's assets                               |
| Stable route/module intent | Likely destination's default-visible/list leaf documents and real lazy chunks       | Every optional layer, details panel, or destination reachable from a menu      |
| Layer intent               | That layer's declared documents and dependencies                                    | Instantiating/rendering a hidden layer just to trigger its loaders             |
| Actual click/navigation    | Promote or join useful in-flight work immediately                                   | Waiting for the speculative queue or delaying navigation to finish preparation |

Treat initial SSR navigation, in-app transitions, and full-page navigation as
separate cases. A memory cache in the old page will not survive a full document
navigation; HTTP caching and server-side preparation are the relevant seams
there. SSR-side cache warming does not directly fill a browser's raster cache.

Data and icons may form a dependency chain: download → parse → select visible
features → resolve custom colors → rasterize → decode. Where module metadata
already identifies default icons, prepare those in parallel with data. Do not
add independently measured data and icon savings as if both had the same lead
time.

## Intent and budgets

- Use deliberate pointer dwell and keyboard focus, with cancellation when intent
  ends. Touch/pointer-down may provide little lead time; never make speculative
  CPU work a prerequisite for the real click. Benchmark lead time starts when
  work starts, **after** any dwell or scheduling delay.
- Give active navigation, visible data, and interaction tasks priority. Stop
  starting speculative jobs on commitment, superseding intent, disposal, a hidden
  tab, or a user/network policy that disables speculation. Check input/idle
  opportunities between jobs instead of starting every target together.
- Bound concurrency, target count, start deadline, retained bytes, and allowed
  origins/resource types. Limits are policy inputs, not universal constants. A
  cap on document count alone is insufficient for large GeoJSON bodies.
- Deduplicate through resource owners. Cancel queued work for an abandoned
  intent; do not abort a shared request that an active navigation now needs.
  Already-running rasterization/import work may finish and remain cacheable.
- The current `warmFeatureSourceUrl`/XHR loader does **not** accept an abort
  signal. Stopping queued work is available; actual in-flight cancellation and
  hard transfer/parse limits need a separate, shared-loader change. Do not claim
  those guarantees from a hover handler alone.
- Start with known, allowlisted, cacheable documents. Revision changes, short
  TTLs, edited/local sources, user-scoped data, and no-store responses must follow
  their normal loader/cache rules. Do not speculatively call arbitrary links or
  mutation endpoints.
- Register/load pictogram packs before preparing their ids: an unknown id can
  resolve to a fallback, which is then cached under that requested key.

A small coordinator with document, code, and icon adapters may eventually be
useful. Its responsibilities are admission, priority, deduplication of intent
leases, and disposal. Resource fetching, freshness, cache keys, and publication
remain in the adapters. Do not build a dependency engine or persistent cache
before the first host integration demonstrates a need.

## First host pilot and acceptance checks

1. Resolve a destination plan without touching active state. Include normalized
   query/module parameters, visible/list requirements, selected-source provenance,
   and recursive dependencies.
2. Supply the same browser document-cache adapter/revision to warming and normal
   demand. Warm a small set after deliberate intent, without activating modules.
3. On navigation, let the normal activation/demand path run and join those
   requests. Prepare effective map icons once their ids/packs are known; keep
   list SVG/PNG loading separate.
4. Compare no speculation, correct prediction, fast click, keyboard focus, touch,
   abandoned intent, changed destination, constrained network, and full reload.
   Include source transfer/JSON parse and critical asset contention, not just
   icons with already-available feature data.
5. Record signal time, admission/start time, commit time, first useful list/map
   state, unused bytes/rasters, duplicate requests, long tasks, real interaction
   latency, and retained memory. A faster completion after click is not enough
   if the earlier view becomes sluggish.

Contract checks include one shared warm/demand flight, no active-state changes
from hover, no speculative error-state poisoning, fresh hydration reuse, revision
and purge correctness, and queued cancellation that leaves a joined demand load
working. Existing core warm/load/purge/race tests cover the cache foundation;
router-event and cross-surface scheduling behavior still need host-level tests.

See the [icon experiment](../../packages/traffic-style/docs/ICON_PRELOADING.md)
for the measured lead-time, cache-stage, and wasted-work trade-offs. It is an
adapter experiment, not a measurement of full-route data prefetching.
