# Configuration merge and loaded feature identity

`mergeConfig` and `mergeConfigAll` from `@mapsight/core/lib/base/actions` apply preset fragments while retaining unchanged state branches. `resetMapsightCore` uses `mergeConfigAll` after clearing highlight, preselect and select. Existing `merge`, `mergeAll`, `set`, `removeFrom` and path routing are unchanged.

Previously, merging a source's config cloned its loaded GeoJSON and derived indexes even when the update contained only the same URL, type and filters. The feature-source controller then treated the new data reference as a possible edit and computed its fingerprint again. The config reducer makes shallow copies only along incoming plain-object/array branches, delegates value merging to lodash, and reuses a previous container when all its own values remain identical. Omitted data is never traversed by the merge.

This is an optimization for acyclic JSON-style preset configuration. Matching plain objects and arrays share unchanged branches. At a visited merge branch, mismatched container types, class instances, dates and typed arrays use lodash's existing conversion behavior. Omitted branches are retained without traversal; unusual nested state containers can therefore retain a prototype that a full legacy clone would convert. Value compatibility is guaranteed for ordinary JSON state/config, not arbitrary JavaScript object graphs. Recursive plain config updates reject cycles with a `TypeError`. Live OpenLayers objects and other mutable objects should continue to use their domain APIs.

## Semantics that still matter

- Arrays merge by index: updating `[1, 2]` with `[3]` produces `[3, 2]`; `[]` does not empty an existing array.
- Incoming `undefined` does not erase an existing value. Omitted keys remain. Use `set(path, value)` to replace, `unset(path)` to set `undefined`, and `removeFrom(path, element)` to remove an array element. Remove object keys by replacing the parent object with `set`.
- A module preset must supply the complete layer catalog and each layer's visibility. A merge does not remove omitted layers. Selection resets still happen on every `resetMapsightCore` call.
- Actual data edits still create new data references and rebuild fingerprints/indexes. URL and loader-type changes still follow the controller's existing data invalidation rules.
- A host adopting the APIs directly needs matching versions of `@mapsight/lib-redux` and `@mapsight/core`. Hosts using `resetMapsightCore` receive the optimization through the corresponding `@mapsight/ui` update. No host config format changes are needed. Middleware that observes raw `MAPSIGHT_MERGE` actions must also recognize `MAPSIGHT_MERGE_CONFIG` for reset/config instrumentation.

## Verification

The [reducer tests](../../lib-redux/src/js/reducers/immutable/merge-config.test.ts) compare nested values, arrays, sparse arrays, undefined, null, inherited keys, prototype protections and unusual value types with lodash. Core controller tests verify unchanged identity, skipped fingerprinting, data edits, and URL/type invalidation. UI tests exercise a module switch with populated selections and a full layer catalog.

Run the captured-state microbenchmark from the repository root:

```sh
MAPSIGHT_CONFIG_BENCH_STATE=/absolute/path/to/state.json \
  pnpm --filter @mapsight/core exec vitest bench --run --reporter=verbose \
  src/js/lib/feature-sources/__tests__/config-merge.bench.ts
```

The snapshot must contain loaded feature collections. Customer data stays outside the repository. The benchmark normalizes the captured state and clones its config so preset arrays do not alias live state. It applies the same config with both actions, checks equal results, and asserts retained data/index references before timing. It separately measures repeated config and changed filters, with 3 warmup iterations and 30 measured iterations per implementation.

On 2026-10-30, a private captured-state fixture (4,046,615 bytes) produced these mean controller reduction times. The fixture is not distributed, so these measurements are illustrative; use the command above with your own snapshot to measure your workload:

| Update             | Existing merge | Config merge |
| ------------------ | -------------: | -----------: |
| Same source config |       44.02 ms |     0.325 ms |
| Changed filters    |       47.09 ms |      6.10 ms |

Environment: Node 24.18.0, Linux x86-64, AMD Ryzen 5 3600XT, unthrottled process. This isolates Redux/controller work; it does not establish mobile frame rate, browser interaction latency, memory behavior or physical-device performance. Browser acceptance tests should measure module switching, selections, map/list contents, pan/zoom and network requests under the agreed emulation profiles.
