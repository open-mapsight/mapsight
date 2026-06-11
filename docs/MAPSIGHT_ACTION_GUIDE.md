# Mapsight Action API — Decision Guide

> **Context:** [MAPSIGHT_REDUX_ARCHITECTURE.md](./MAPSIGHT_REDUX_ARCHITECTURE.md) explains how the store, controllers, and path routing work. This guide answers a narrower question: _which action API do I dispatch for a given task?_

Mapsight has three coexisting action systems. Pick the one that matches your intent — not whichever import is closest.

---

## Quick reference

| I want to…                  | Use                                                        |
| --------------------------- | ---------------------------------------------------------- |
| Apply CMS / preset JSON     | `mergeAll`, `set`, `resetMapsightCore`                     |
| Switch entire view/module   | `resetMapsightCore`                                        |
| Animate map, fit to feature | Domain actions in `@mapsight/core/lib/map/actions`         |
| Load GeoJSON                | `LOAD_FEATURE_SOURCE` family (`load`, …)                   |
| Toggle list/panel/layout    | `@mapsight/ui/store/actions` (`app` slice)                 |
| OL reported pan/zoom        | Already handled in controllers — don't dispatch from React |

---

## 1. Apply CMS / preset JSON

**Use:** path actions from `@mapsight/core/lib/base/actions`, and `resetMapsightCore` when you also need to clear selections.

- `set(path, value)` — replace a single value (layer visibility, one field).
- `merge(path, value)` — shallow-merge an object at a path.
- `mergeAll({ map: …, featureSources: … })` — batch several top-level slices at once.
- `resetMapsightCore(config)` — deselect all features, then `mergeAll(config)` (see §2).

Paths are arrays routed by the first segment (`["map", "layers", id, …]`).

### Good

```typescript
import {mergeAll, set} from "@mapsight/core/lib/base/actions";

// Bulk preset fragment: layers + sources in one batch
store.dispatch(
	mergeAll({
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

`base` should include a **complete** layer catalog for the target module. `mergeAll` deep-merges `map.layers`; omitted layer IDs survive from the previous module.

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

## Cheat sheet: imports

| Package          | Path                          | When                                              |
| ---------------- | ----------------------------- | ------------------------------------------------- |
| `@mapsight/core` | `lib/base/actions`            | `set`, `merge`, `mergeAll`, `controlled`, `quiet` |
| `@mapsight/core` | `lib/map/actions`             | Animate, fit, layer visibility, interactions      |
| `@mapsight/core` | `lib/feature-sources/actions` | `load`, feature CRUD, undo/redo                   |
| `@mapsight/ui`   | `store/actions`               | `resetMapsightCore`, layout, list UI, fetch cache |

When in doubt: **serializable config → path actions; imperative GIS ops → domain actions; chrome/layout → UI actions.**
