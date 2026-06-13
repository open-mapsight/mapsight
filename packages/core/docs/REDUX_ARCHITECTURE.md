# Mapsight Redux Architecture

> **Package:** `@mapsight/core` · **Hub:** [Documentation index](../../../docs/README.md)
>
> **What this is:** A reference for how Mapsight’s GIS state layer works today — not a migration plan. Phased RTK and Zod modernization is in progress.

**See also:** [Action API decision guide](./ACTION_GUIDE.md)

---

## TL;DR

Mapsight is not “Redux with a map component.” It is a **declarative GIS runtime**:

1. The entire map (layers, view, controls, interactions, feature data) is described as **serializable JSON** in a single Redux store.
2. **Controllers** watch that JSON and sync it to real OpenLayers objects (and back).
3. **Path-based actions** (`set`, `merge`, `mergeAll`) let you mutate any part of the tree — including bulk CMS-driven reconfiguration without a page reload.
4. A **controlled / uncontrolled** distinction prevents infinite loops when OpenLayers reports zoom/pan back into Redux.

React is a thin view layer on top. The core is usable without React.

---

## Mental model

Think of Redux state as the **target document** (like a VDOM for the map). Controllers are **reconcilers** that diff state against OpenLayers and apply changes.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Redux Store                               │
│  ┌─────────┐ ┌─────────┐ ┌────────────────┐ ┌───────────────┐  │
│  │   map   │ │  list   │ │ featureSources │ │ featureSelect…│  │
│  │ (JSON)  │ │ (JSON)  │ │    (JSON)      │ │    (JSON)     │  │
│  └────┬────┘ └─────────┘ └───────┬────────┘ └───────────────┘  │
│       │                          │                              │
│  ┌────┴────┐              ┌──────┴──────┐                      │
│  │   app   │  (UI slice)  │ projections │  …other controllers  │
│  └─────────┘              └─────────────┘                      │
└───────────────────────────────┬─────────────────────────────────┘
                                │
              observeUncontrolled (state → OL)
              controlled + async   (OL → state)
                                │
                                ▼
                    ┌───────────────────────┐
                    │   MapController       │
                    │   (+ mixin modules)   │
                    │   ol-proxy            │
                    └───────────┬───────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │     OpenLayers        │
                    │  Map, Layers, View,   │
                    │  Controls, Sources    │
                    └───────────────────────┘
```

---

## Store creation

Entry point: `createMapsightStore()` in `packages/core/src/js/index.ts`.

```typescript
createMapsightStore(
	controllers, // { map: MapController, list: ListController, … }
	appReducers, // optional extra slices, e.g. { app: mapsightUiAppReducer }
	preLoadedState, // initial JSON tree (from preset / CMS / SSR)
	appEnhancer, // e.g. redux-thunk for UI
);
```

What happens:

1. **One reducer per controller** — `combineReducers` keys match controller names (`map`, `list`, `featureSources`, …).
2. **Path filtering** — each controller reducer is wrapped with `createFilteredReducerForPath`, so `meta.path[0]` routes actions to the right slice.
3. **Store enhancements** (applied in order):
    - `enableAsyncDispatch` — queue actions flagged `MAPSIGHT_ASYNC_ACTION` (dispatch-during-dispatch workaround).
    - `enableControlledDispatchAndObserve` — adds `observeUncontrolled` / `subscribeUncontrolled`.
    - `batchDispatchMiddleware` — `redux-batched-actions` support.
    - `createPrefixedAsyncActionMiddleware` — thunk-like functions flagged as async.
4. **Controller binding** — each controller gets `bindToStore(store)` then `init()` (wires OL listeners).

The UI package (`@mapsight/ui`) calls this via `create()` in `packages/ui/src/js/index.ts`, supplying default controllers and the `app` reducer.

---

## State shape (top-level slices)

Default controller keys (`packages/ui/src/js/config/constants/controllers.ts`):

| Slice key           | Controller                    | Role                                             |
| ------------------- | ----------------------------- | ------------------------------------------------ |
| `map`               | `MapController`               | Layers, view, controls, interactions, animations |
| `list`              | `ListController`              | List/query state (mostly path-driven)            |
| `featureSources`    | `FeatureSourcesController`    | GeoJSON data, XHR loading, undo/redo             |
| `featureSelections` | `FeatureSelectionsController` | Select / preselect / highlight                   |
| `tagFilter`         | `FilterController`            | Tag-based feature filtering                      |
| `timeFilter`        | `FilterController`            | Time-based filtering                             |
| `projections`       | `ProjectionsController`       | Proj4 definitions                                |
| `userGeolocation`   | `UserGeolocationController`   | Geolocation tracking                             |
| `app`               | `mapsightUiAppReducer`        | Layout, modals, fetch cache, list UI prefs       |

> **“Dynamic slices” clarification:** You can register multiple instances of the same controller class (e.g. `map` and `map2`) at store creation time. What is dynamic is the **keys inside** each slice (`layers.foo`, `layers.bar`). You cannot add a new top-level slice after the store exists without `injectReducer` (not used today).

### Example: `map` slice (simplified)

```typescript
{
  view: { center: […], zoom: 12, resolution: …, rotation: 0 },
  size: [width, height],
  layers: {
    "base-osm": {
      type: "OSM",
      options: { visible: true },
      metaData: { title: "…", isBaseLayer: true, group: "base" }
    },
    "poi-layer": {
      type: "Vector",
      options: {
        visible: true,
        source: { type: "VectorFeatureSource", options: { featureSourceId: "pois" } }
      }
    }
  },
  controls: { … },
  interactions: { … },
  visibleLayers: ["poi-layer", …]
}
```

Layer definitions use the **ol-proxy `Description`** shape: `{ type, options?, metaData? }`. Types map to registered OpenLayers constructors in the dependency injector (`packages/core/src/js/ol-proxy`).

---

## Controllers

`BaseController` (`packages/core/src/js/lib/base/controller.ts`) is the foundation.

Each controller:

- Owns **one top-level slice** of state (selected by `state[controllerName]`).
- Exposes `dispatch`, `getState`, `observeUncontrolled`, `getAndObserveUncontrolled`.
- Implements `reduce(state, action)` → runs registered reducers, then **`baseReducer`** (generic path mutations).
- Runs **`init()`** after all controllers are bound — this is where OL sync is wired up.

### MapController composition

`MapController` is built from **mixins** copied onto its prototype at module load:

| Mixin                     | Responsibility                                  |
| ------------------------- | ----------------------------------------------- |
| `WithMap`                 | Core `ol/Map`, view sync (center/zoom/rotation) |
| `WithLayers`              | Layer create/update/destroy via ol-proxy        |
| `WithControls`            | OL controls                                     |
| `WithInteractions`        | Draw, select, etc.                              |
| `WithAnimations`          | `animate`, fit-to-extent                        |
| `WithVisibleLayers`       | Derived visible layer list                      |
| `WithSize`                | Map container dimensions                        |
| `WithStyleFunction`       | Vector styling                                  |
| `WithFeatureInteractions` | Feature click/hover wiring                      |
| …                         |                                                 |

Each mixin’s `init()` registers `getAndObserveUncontrolled` handlers that diff state and call `updateProxyObject`.

`registerReducer()` allows domain-specific reducer logic inside a controller (e.g. `WithLayers` enforces “only one base layer visible”).

---

## Path-based actions

Generic mutation API in `packages/core/src/js/lib/base/actions.ts`:

| Function                    | Effect                         |
| --------------------------- | ------------------------------ |
| `set(path, value)`          | Replace value at path          |
| `merge(path, value)`        | Shallow-merge object at path   |
| `addTo(path, element)`      | Append to array at path        |
| `removeFrom(path, element)` | Remove from array at path      |
| `unset(path)`               | `set(path, undefined)`         |
| `setAll` / `mergeAll` / …   | Batch variant over object keys |

Paths are arrays: `["map", "layers", "foo", "options", "visible"]`.

Actions use generic types: `MAPSIGHT_SET`, `MAPSIGHT_MERGE`, etc. The path lives in `action.meta.path`.

### Path routing

`createFilteredReducerForPath(reducer, "map", "path")`:

- If `action.meta.path[0] === "map"` → strip first segment, pass to reducer.
- Otherwise → ignore (return previous state).

This lets one action type work across all slices without slice-specific action creators.

### Immutability

`baseReducer` delegates to `packages/lib-redux/reducers/immutable-path`, which:

1. Reads old value at path (`lodash/get`).
2. Applies inner reducer (`set`, `merge`, …).
3. Writes back via `deepChangeState` (clones parent chain, no mutation).

---

## Action flags (meta)

| Flag       | Constant                     | Purpose                                                                                                |
| ---------- | ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| Controlled | `MAPSIGHT_CONTROLLED_ACTION` | “This update came from OL, don’t sync back to OL.” Skipped by `observeUncontrolled`.                   |
| Async      | `MAPSIGHT_ASYNC_ACTION`      | Queue dispatch to avoid dispatch-during-dispatch. Often wraps thunks that dispatch controlled actions. |
| Quiet      | `MAPSIGHT_QUIET_ACTION`      | Hide from Redux DevTools (high-frequency updates like zoom).                                           |

Helpers: `controlled(action)`, `async(action)`, `quiet(action)` — recursively applied inside batched actions. See [Batched actions caveat](#batched-actions-caveat-redux-batched-actions) below for why that recursion matters.

---

## Controlled ↔ uncontrolled sync (the loop breaker)

**Problem:** State drives OL, but OL events (pan, zoom) must update state. Without a guard, you get: state change → OL update → OL event → state change → …

**Solution:**

```
User / CMS / React                OpenLayers
       │                               │
       │  dispatch(set(…))             │
       │  (uncontrolled)               │
       ├──────────────────────────────►│  observeUncontrolled handler
       │                               │  applies to OL
       │                               │
       │                               │  view 'change:center'
       │◄──────────────────────────────┤
       │  dispatch(controlled(          │
       │    async(() => set(…))        │
       │  ))                           │
       │  (controlled — observers      │
       │   do NOT fire)                │
```

Implementation: `enableControlledDispatchAndObserve` patches `store.dispatch` to remember if the last action was controlled, and only notifies `observeUncontrolled` listeners when it was not.

**Typical OL → state path** (`WithMap.ts`):

```typescript
view.on("change:center", () => {
	this.dispatch(
		async(() => {
			this.dispatch(controlled(setViewCenter(name, view.getCenter())));
		}),
	);
});
```

**Typical state → OL path** (`WithLayers.ts`):

```typescript
this.getAndObserveUncontrolled(
	(state) => state.layers,
	(newDefs, oldDefs) => {
		/* updateProxyObject per layer */
	},
);
```

### Batched actions caveat (`redux-batched-actions`)

Mapsight batches related dispatches with `batchActions()` from `redux-batched-actions`. The
`batchDispatchMiddleware` does **not** treat a batch as one atomic dispatch — it unwraps the
wrapper and calls `store.dispatch` once per child action.

`enableControlledDispatchAndObserve` mirrors that: it sets a `wasControlled` flag on **each**
`dispatch` call, based only on whether **that** action carries
`meta.MAPSIGHT_CONTROLLED_ACTION`. After every dispatch (including each child inside a batch),
the store subscription runs and `observeUncontrolled` listeners fire when `wasControlled` is
false.

**Implication:** marking only the outer batch wrapper as controlled is not enough. If children
are dispatched without the flag, observers treat them as uncontrolled and may sync state back
to OpenLayers — reintroducing the feedback loop the controlled flag exists to prevent.

**What Mapsight does:** `controlled()` (and `quiet()`) recurse into batched payloads and apply
the flag to every child:

```typescript
// packages/core/src/js/lib/base/actions.ts
export function controlled(action: Action) {
	action.meta = action.meta || {};
	action.meta[CONTROLLED_ACTION_FLAG] = true;

	if (isBatchedAction(action)) {
		action.payload = action.payload.map((batchedAction) =>
			controlled(batchedAction),
		);
	}

	return action;
}
```

So `dispatch(controlled(batchActions([setA, setB])))` results in two child dispatches, each
individually flagged — observers stay quiet for the whole batch.

**Contributor checklist:**

| Do                                                                         | Don't                                                                 |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Use `controlled(batchActions([…]))` or `controlled()` per child            | Hand-roll `{ meta: { batch: true }, payload: […] }` without recursing |
| Copy the recurse pattern when adding new meta-flag helpers                 | Assume the outer batch wrapper propagates flags to children           |
| Use `flattenActions()` when inspecting batch contents (DevTools, watchers) | Rely on the wrapper action alone for controlled / quiet semantics     |

See also: `packages/lib-redux/src/js/flatten-actions.ts` (deep flatten for nested batches).

---

## ol-proxy

`packages/core/src/js/ol-proxy/index.ts` bridges JSON definitions to OpenLayers instances.

**`updateProxyObject({ oldObject, oldDefinition, newDefinition, adder, remover })`:**

1. If `newDefinition` is null/undefined → call `remover` (destroy).
2. If type changed or options require reconstruction → create new OL object.
3. Otherwise → `setOptions` to patch existing object.

The dependency injector (`di`) maps `type: "Vector"` → constructor, `optionMap`, `eventMap`.

This is the same pattern React uses (declarative description → imperative DOM), but for OpenLayers.

---

## Three action systems (know which to use)

Mapsight has evolved three coexisting patterns:

### 1. Path actions (preferred for declarative config)

```typescript
import { set, merge, mergeAll } from "@mapsight/core/lib/base/actions";

mergeAll({ map: { layers: { … } }, featureSources: { … } });
set(["map", "view", "zoom"], 14);
```

**Use for:** CMS JSON, presets, cross-slice bulk updates, anything that should be serializable.

### 2. Domain actions (imperative GIS operations)

```typescript
import {LOAD_FEATURE_SOURCE} from "@mapsight/core/lib/feature-sources/actions";
import {
	animate,
	fitMapViewToLayerFeature,
} from "@mapsight/core/lib/map/actions";
```

**Use for:** Operations with side effects, typed parameters, or reducer logic that does not fit a simple path set (feature loading, undo/redo, fit-to-feature).

### 3. App UI actions (layout & chrome)

```typescript
import {setListVisible, setView} from "@mapsight/ui/store/actions";
```

**Use for:** Panel visibility, breakpoints, list pagination, JSON fetch cache. Lives in the `app` slice. _Candidates for eventual extraction out of GIS Redux._

---

## Declarative pages / MPA without reload

The original design goal: load a JSON config and reset the entire application state.

**Pattern:**

```typescript
import {resetMapsightCore} from "@mapsight/ui/store/actions";

import {mergeAll} from "@mapsight/core/lib/base/actions";

// Full reset: clear selections + apply new config tree
store.dispatch(resetMapsightCore(newConfig));

// Partial reconfiguration (e.g. router module switch)
store.dispatch(mergeAll({map: moduleMapConfig, featureSources: moduleSources}));
```

Real example: Stadtplan router plugin dispatches `mergeAll(base)` on module change (`apps/example/src/js/presets/stadtplan.tsx`).

**Initial state** is assembled in `create()`:

```typescript
initialState = merge({}, baseMapsightConfig, {app: uiState});
// optionally merged with reHydratedState from SSR
```

Plugins can further restore from localStorage via `mergeAll` after first render.

---

## React integration

Minimal by design:

```tsx
// packages/ui/src/js/components/helping/app-context.tsx
<ReduxProvider store={store}>
	<App />
</ReduxProvider>
```

Components use standard `useSelector` / `useDispatch`. The heavy sync work happens in controllers, not in `useEffect` hooks.

`create()` returns a `MapsightUiContext` with `store`, `render()`, plugins, and `controllers` — usable from non-React hosts (embed scripts, PHP pages).

### SSR / hydration

- Server renders with dehydrated state embedded in the DOM.
- Client `create()` merges `reHydratedState` into `initialState`.
- Plugins (e.g. localStorage) may defer `mergeAll` until after first render to avoid DOM mismatch.

---

## Feature sources & selections (data layer)

**FeatureSourcesController** is the most complex controller:

- Loads GeoJSON via XHR (`LOAD_FEATURE_SOURCE` → `LOAD_FEATURE_SOURCE_SUCCESS`).
- Supports undo/redo history per source.
- Can bind external store selectors via `bindFeatureSourceToStore`.
- Mixes domain reducers with path-based `baseReducer`.

**FeatureSelectionsController** manages select / preselect / highlight state, wired to list and map interactions.

Layers reference feature data indirectly:

```typescript
source: {
  type: "VectorFeatureSource",
  options: { featureSourceId: "pois", featureSourcesControllerName: "featureSources" }
}
```

---

## Plugins

`@mapsight/ui` supports a plugin system with lifecycle hooks:

| Phase          | When                                              |
| -------------- | ------------------------------------------------- |
| `afterInit`    | Before store creation (can modify `initialState`) |
| `afterCreate`  | After store exists (can subscribe, dispatch)      |
| `beforeRender` | Can delay render (async data)                     |
| `afterRender`  | Post-first-paint (e.g. localStorage restore)      |

Plugins receive `MapsightUiContext` and are the extension point for app-specific behavior without forking core.

---

## Key files reference

| Area                | Path                                                                  |
| ------------------- | --------------------------------------------------------------------- |
| Store factory       | `packages/core/src/js/index.ts`                                       |
| Path actions        | `packages/core/src/js/lib/base/actions.ts`                            |
| Base reducer        | `packages/core/src/js/lib/base/reducer.ts`                            |
| Base controller     | `packages/core/src/js/lib/base/controller.ts`                         |
| Map controller      | `packages/core/src/js/lib/map/controller.ts`                          |
| Map mixins          | `packages/core/src/js/lib/map/lib/With*.ts`                           |
| ol-proxy            | `packages/core/src/js/ol-proxy/index.ts`                              |
| Controlled observe  | `packages/lib-redux/src/js/enable-controlled-dispatch-and-observe.ts` |
| Path filter         | `packages/lib-redux/src/js/create-filtered-reducer-for-path.ts`       |
| Immutable path      | `packages/lib-redux/src/js/reducers/immutable-path/`                  |
| UI entry            | `packages/ui/src/js/index.ts`                                         |
| Default controllers | `packages/ui/src/js/controllers/defaults.ts`                          |
| App reducer         | `packages/ui/src/js/store/reducers.ts`                                |
| Types (core)        | `packages/core/src/js/types.ts`                                       |
| Map state types     | `packages/core/src/js/lib/map/types.ts`                               |

---

## Glossary

| Term                    | Meaning                                                                 |
| ----------------------- | ----------------------------------------------------------------------- |
| **Controller**          | Class owning one state slice + OL sync side effects                     |
| **Description**         | JSON `{ type, options?, metaData? }` describing an OL object            |
| **Path action**         | Generic `MAPSIGHT_SET` etc. with `meta.path`                            |
| **Controlled action**   | OL-originated update; observers skip it                                 |
| **Uncontrolled action** | User/CMS/React update; observers apply to OL                            |
| **Preset**              | App-specific function returning initial state JSON (e.g. `stadtplan()`) |
| **Mixin**               | MapController capability module (`WithLayers`, …)                       |

---

## What this architecture optimizes for

✅ Serializable, CMS-driven map configuration  
✅ Single store for time-travel debugging and SSR  
✅ Framework-agnostic GIS core  
✅ Multiple map/list instances via named controllers  
✅ Bidirectional OL sync without feedback loops

## What it does not optimize for

❌ Strict TypeScript path safety (yet)  
❌ Minimal Redux boilerplate  
❌ Colocating UI state with React components  
❌ Runtime-dynamic slice injection

---

_Last updated: June 2026_
