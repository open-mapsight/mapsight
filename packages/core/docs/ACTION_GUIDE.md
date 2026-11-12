# Mapsight Action API — Decision Guide

> **Package:** `@mapsight/core` · **Hub:** [Documentation index](../../../docs/README.md)
>
> **Context:** [Redux architecture](./REDUX_ARCHITECTURE.md) explains how the store, controllers, and path routing work. This guide answers a narrower question: _which action API do I dispatch for a given task?_

Mapsight has three coexisting action systems. Pick the one that matches your intent — not whichever import is closest.

---

## Quick reference

| I want to…                  | Use                                                        |
| --------------------------- | ---------------------------------------------------------- |
| Apply CMS / preset JSON     | `mergeConfigAll`, `set`, `resetMapsightCore`               |
| Switch entire view/module   | `resetMapsightCore`                                        |
| Animate map, fit to feature | Domain actions in `@mapsight/core/lib/map/actions`         |
| Load GeoJSON                | `LOAD_FEATURE_SOURCE` family (`load`, …)                   |
| Remove a layer or source    | `removeLayer`, `removeFeatureSource` (see §7)              |
| Toggle list/panel/layout    | `@mapsight/ui/store/actions` (`app` slice)                 |
| OL reported pan/zoom        | Already handled in controllers — don't dispatch from React |

---

## 1. Apply CMS / preset JSON

**Use:** path actions from `@mapsight/core/lib/base/actions`, and `resetMapsightCore` when you also need to clear selections.

- `set(path, value)` — replace a single value (layer visibility, one field).
- `mergeConfig(path, value)` — deep-merge acyclic JSON-style config, keeping unchanged branches by reference.
- `mergeConfigAll({ map: …, featureSources: … })` — batch several top-level config slices at once.
- `merge` / `mergeAll` — the existing deep-merge actions; their behavior is unchanged.
- `resetMapsightCore(config)` — deselect all features, then `mergeConfigAll(config)` (see §2).

Both merge families keep omitted keys, ignore incoming `undefined` for existing values, and merge arrays **by index**. They do not replace arrays or remove keys. Use `set` for replacement, `removeFrom` to remove an array element, and `removeKey(path)` to delete an object key. `unset(path)` only sets the value to `undefined` and leaves the key in place, unless the store has the `v15_unsetRemovesKey` future flag (below). To remove a layer or feature source at runtime, use the domain actions in §7. The config family avoids copying loaded GeoJSON omitted from a preset; [configuration merge performance](./CONFIG_MERGE.md) describes its scope and verification.

Paths are arrays routed by the first segment (`["map", "layers", id, …]`).

### Good

```typescript
import {mergeConfigAll, set} from "@mapsight/core/lib/base/actions";

// Bulk preset fragment: layers + sources in one batch
store.dispatch(
	mergeConfigAll({
		map: {layers: moduleLayers, view: {zoom: 12}},
		featureSources: moduleSources,
	}),
);

// Single field tweak
store.dispatch(set(["map", "layers", "poi-layer", "options", "visible"], true));
```

### Anti-pattern

```typescript
// ❌ Don't hand-roll action objects — you lose path routing and batching
store.dispatch({
	type: "MAPSIGHT_MERGE",
	value: {visible: true},
	meta: {path: ["map", "layers", "poi-layer", "options"]}, // easy to get wrong
});
```

---

## 2. Switch entire view / module

**Use:** `resetMapsightCore` from `@mapsight/ui/store/actions`.

Module switches replace most GIS slices and must not leave ghost layers or selections from the previous module. `resetMapsightCore` clears highlight/preselect/select, then deep-merges the new config tree.

When only a partial update is safe (e.g. restoring localStorage), `mergeAll` alone is fine — but module switches are not that case.

### Good

```typescript
import {
	resetMapsightCore,
	setTagFilterControl,
} from "@mapsight/ui/store/actions";

// Stadtplan router: full GIS reset on module change, then UI-only follow-up
const {app, ...base} = getConfigForCityMapModule(moduleId);
store.dispatch(resetMapsightCore(base));
store.dispatch(
	setTagFilterControl(
		app.tagSwitcher.show,
		"featureSources",
		app.tagSwitcher.featureSourceId ?? "_",
	),
);
```

`base` should include a **complete** layer catalog for the target module, including explicit visibility for inactive layers. Both merge families deep-merge `map.layers`; omitted layer IDs survive from the previous module. Structural sharing does not change this requirement.

### Anti-pattern

```typescript
// ❌ mergeAll without clearing selections — features stay highlighted across modules
store.dispatch(mergeAll(getConfigForCityMapModule(moduleId)));

// ❌ Replacing only map.layers — list, featureSources, filters can drift
store.dispatch(set(["map", "layers"], newLayers));
```

---

## 3. Animate map, fit to feature

**Use:** domain actions in `@mapsight/core/lib/map/actions` — `animate`, `fitMapViewToLayerFeature`, `fitMapViewToLayerSourceExtent`, `setLayerVisibility`, interaction helpers, etc.

These run reducer/controller logic (animations, fit bounds, base-layer rules) that a raw `set(["map", "view", …])` bypasses.

### Good

```typescript
import {easeOut} from "ol/easing";

import {
	animate,
	fitMapViewToLayerFeature,
} from "@mapsight/core/lib/map/actions";

store.dispatch(
	animate("map", {
		duration: 1000,
		easing: easeOut,
		bounds: regionExtent,
		nearest: true,
	}),
);

store.dispatch(
	fitMapViewToLayerFeature("map", "poi-layer", featureId, {maxZoom: 16}),
);
```

### Anti-pattern

```typescript
import {set} from "@mapsight/core/lib/base/actions";

// ❌ Writing view center/zoom directly — skips animation mixin and controlled sync
store.dispatch(set(["map", "view", "center"], clickedCoordinate));
store.dispatch(set(["map", "view", "zoom"], 14));
```

Use path `set` for **declarative config** (initial view in a preset). Use **domain actions** for **imperative map behavior** after the map is running.

---

## 4. Load GeoJSON

**Use:** the `LOAD_FEATURE_SOURCE` family from `@mapsight/core/lib/feature-sources/actions`. Prefer the `load()` thunk — it handles request IDs, cache, and success/error follow-ups.

Related: `setData` for local/cached data, `addFeature` / `updateFeature` for edits (often wrapped in `controlled()`).

### Good

```typescript
import {load} from "@mapsight/core/lib/feature-sources/actions";

// XHR or local loader — controller picks strategy from featureSources[id].type
store.dispatch(load("featureSources", "pois", {forceRefresh: true}));
```

Feature source **config** (`type`, `url`, filters) still belongs in preset JSON via `mergeAll`. `load()` fetches or hydrates **data** into that config.

### Anti-pattern

```typescript
import {LOAD_FEATURE_SOURCE} from "@mapsight/core/lib/feature-sources/actions";

// ❌ Dispatching the raw constant — no loader, no cache, no requestId deduping
store.dispatch({
	type: LOAD_FEATURE_SOURCE,
	id: "pois",
	meta: {path: ["featureSources"]},
});
```

---

## 5. Toggle list / panel / layout

**Use:** `@mapsight/ui/store/actions` — these update the `app` slice (`mapsightUiAppReducer`), not GIS controllers.

Examples: `setListVisible`, `setView`, `setMapVisible`, `setListPage`, `fetchJson`, `setOverlayModalVisible`.

**Phase 1 rule:** do not add new fields to `mapsightUiAppReducer` during the demo push. Prefer existing actions or local React state for new UI-only concerns.

### Good

```typescript
import {VIEW_MAP_ONLY} from "@mapsight/ui/config/constants/app";
import {setListVisible, setView} from "@mapsight/ui/store/actions";

store.dispatch(setView(VIEW_MAP_ONLY));
store.dispatch(setListVisible(false));
```

### Anti-pattern

```typescript
import {set} from "@mapsight/core/lib/base/actions";

// ❌ Layout flags don't live under map/list controllers
store.dispatch(set(["app", "listVisible"], false)); // bypasses app reducer cases

// ❌ Don't put panel open/closed state into map JSON
store.dispatch(set(["map", "options", "listOpen"], true));
```

---

## 6. OpenLayers pan / zoom feedback

**Use:** nothing from application code. `WithMap` (and related mixins) listen to OL view events and dispatch `controlled(async(() => setViewCenter(…)))` back into Redux.

User-driven pan/zoom must not re-enter through React components — that causes double updates, sync loops, and DevTools noise.

### Good

```typescript
// In a React component — read view state if needed, but don't write it on pan/zoom
const center = useSelector((state) => state.map?.view?.center);

// To move the map intentionally, use domain actions (see §3)
store.dispatch(animate("map", {center: target, duration: 500}));
```

Controllers already mark high-frequency feedback with `quiet()` so DevTools stays usable.

### Anti-pattern

```typescript
import {setViewCenter} from "@mapsight/core/lib/map/actions";

// ❌ Never mirror OL view events from React / plugins
map.getView().on("change:center", () => {
	store.dispatch(setViewCenter("map", map.getView().getCenter()!));
});

// ❌ Don't use uncontrolled path sets for live view — fights the controller loop
store.dispatch(set(["map", "view", "center"], map.getView().getCenter()));
```

---

## 7. Remove a layer or feature source at runtime

**Use:** `removeLayer` from `@mapsight/core/lib/map/actions` and `removeFeatureSource` from `@mapsight/core/lib/feature-sources/actions`. Both delete the key from the state (they are built on `removeKey` from `@mapsight/core/lib/base/actions`). Hosts that add layers and sources at runtime with `set` or `mergeConfig` use them to take a single one away again.

- `removeLayer(controllerName, layerId)` deletes `layers[layerId]` from the map state; the map controller then removes the OpenLayers layer and tears down its vector source, which stops reacting to feature source and selection changes (no more map fitting). Other layers on the same feature source are not affected. Layers whose `metaData.visibleWhenLayerIds` lists it become invisible. It does **not** remove the layer's feature source, because a source can feed several layers or the feature list, and it does **not** touch feature selections. Remove the source separately, and clear selections that refer to its features first.
- `removeFeatureSource(controllerName, id)` deletes the source with its data, load state and history. A load still in flight is ignored when it completes and does not recreate the source, a refreshing source stops refreshing, and combined sources skip the removed member. Layers bound to the source are not removed; they keep the features they already show until they are removed too. A feature list bound to the removed source (`list.featureSource`), or a combined list whose members were all removed, shows its empty state instead of loading. Point `list.featureSource` at another source and remove the id from the `featureSourceNames` of combined sources to keep the state tidy.
- Actions addressed to a source id that is not in the state are ignored: `setData`, `setError`, `loadSuccess`, `loadFailure`, `pauseRefreshUntilNextLoad`, feature edits and `undo`/`redo`. Before, the first group threw for unknown ids and `setError`, unbound `loadFailure` and the pause created a partial source. Create a source through config (`set` or `mergeConfig` of `featureSources.<id>`) before you write to it.
- Unknown ids are ignored by `removeLayer` and `removeFeatureSource`, the state reference stays unchanged.
- `unset(path)` is **not** meant for this today. By default it keeps the key with an `undefined` value (`"layers" in state` stays true). Core's reducers, controllers and selectors tolerate such entries by skipping them, but they stay in the state, and they do not survive serialisation.

### `unset` and the `v15_unsetRemovesKey` future flag

`unset(path)` is `set(path, undefined)` plus a marker in `action.meta`. The next major of `@mapsight/core` will make it delete the key. Until then the default is unchanged, and a store opts in with the `future` option (same contract as [Decision 012](../../../docs/architecture/decisions/012-future-flags-for-next-major-ui.md): `true` is the next major's behavior, omitted or `false` is today's):

```typescript
import {createMapsightStore} from "@mapsight/core";

const store = createMapsightStore(controllers, {}, initialState, null, {
	future: {v15_unsetRemovesKey: true},
});
```

`@mapsight/ui` forwards `createOptions.future.v8_unsetRemovesKey` to it.

| `unset(path)` where…                             | Flag off (default)                        | Flag on                           |
| ------------------------------------------------ | ----------------------------------------- | --------------------------------- |
| the parent is a plain object and owns the key    | key stays, value `undefined`              | key deleted, like `removeKey`     |
| the parent is an array                           | element becomes `undefined`               | same, arrays are not shortened    |
| the key or its parent does not exist             | nothing happens, same state reference     | same                              |
| the key exists with value `undefined` already    | nothing happens, same state reference     | key deleted                       |
| the path is a whole controller state (`["map"]`) | the store throws (reducer is `undefined`) | same                              |
| a plain `set(path, undefined)`                   | key stays, value `undefined`              | same, the flag does not affect it |

The flag is read per store, so stores with different settings can live on one page. Batches (`batchActions`, `setAll`), `controlled()`, `quiet()` and `async()` keep the marker and are resolved the same way. Controller reducers registered with `registerReducer()` see a `MAPSIGHT_REMOVE_KEY` action instead of `MAPSIGHT_SET` for an unset that deletes a key; reducers passed to `createMapsightStore` as app reducers see the original action. With the flag on, `unset(["map", "layers", id])` and `unset(["featureSources", id])` behave like `removeLayer` and `removeFeatureSource`, and `removeInteractionSelection` deletes the interaction from `options.selections`. Prefer `removeKey` and the domain actions where you can: they work in both modes.

### Good

```typescript
import {removeFeatureSource} from "@mapsight/core/lib/feature-sources/actions";
import {removeLayer} from "@mapsight/core/lib/map/actions";

// Remove a runtime layer first, then the source that only it used
store.dispatch(removeLayer("map", "poi-layer"));
store.dispatch(removeFeatureSource("featureSources", "pois"));
```

### Anti-pattern

```typescript
import {set, unset} from "@mapsight/core/lib/base/actions";

// ❌ Leaves `poi-layer: undefined` behind in the state (unless the store has `v15_unsetRemovesKey`)
store.dispatch(unset(["map", "layers", "poi-layer"]));

// ❌ Replacing the whole parent just to drop one key
store.dispatch(set(["map", "layers"], withoutPoiLayer));
```

---

## Cheat sheet: imports

| Package          | Path                          | When                                                   |
| ---------------- | ----------------------------- | ------------------------------------------------------ |
| `@mapsight/core` | `lib/base/actions`            | `set`, `merge`, `mergeAll`, `controlled`, `quiet`      |
| `@mapsight/core` | `lib/map/actions`             | Animate, fit, layer visibility, `removeLayer`          |
| `@mapsight/core` | `lib/feature-sources/actions` | `load`, feature CRUD, undo/redo, `removeFeatureSource` |
| `@mapsight/ui`   | `store/actions`               | `resetMapsightCore`, layout, list UI, fetch cache      |

When in doubt: **serializable config → path actions; imperative GIS ops → domain actions; chrome/layout → UI actions.**
