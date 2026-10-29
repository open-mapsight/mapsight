# Embed config reference

Mapsight config is a **single serializable JSON object** passed to `create()` or `browserEmbed()`. Top-level slices map
to Redux controllers registered at startup.

For CMS hosts, config is passed **inline in the page snippet** — not baked into the JavaScript build.
See [CMS_PHP](CMS_PHP.md).

---

## Minimal valid config

```json
{
	"map": {
		"layers": {
			"base": {
				"type": "OSM"
			}
		}
	}
}
```

---

## Top-level slices (default `@mapsight/ui`)

| Slice               | Purpose                      |
| ------------------- | ---------------------------- |
| `map`               | Layers, view, interactions   |
| `featureSources`    | GeoJSON / API loaders        |
| `list`              | Feature list                 |
| `featureSelections` | Highlight / select state     |
| `projections`       | CRS helpers                  |
| `tagFilter`         | Tag-based feature filtering  |
| `timeFilter`        | Date range feature filtering |
| `userGeolocation`   | Browser geolocation          |
| `app`               | UI State                     |

---

## Common fields

### `featureSources`

```json
{
	"featureSources": {
		"events": {
			"type": "xhr-json",
			"url": "https://example.org/data/events.geojson"
		}
	}
}
```

Loader helpers live in `@mapsight/ui/config/feature/sources` (`xhrJson`, `plain`, …).

### `map.layers`

**Basemap** (OSM, XYZ, WMS raster) and **thematic** vector layers are separate concerns. Basemap
patterns: [Ecosystem § basemaps](../architecture/ECOSYSTEM.md). GeoServer **overlay**
WMS/WFS: [OGC_LAYERS](OGC_LAYERS.md) — not the same as XYZ basemap / tile-proxy.

### `list`

```json
{
	"list": {
		"featureSource": "events",
		"visible": true,
		"featureSelectionHighlight": "highlight",
		"featureSelectionSelect": "select"
	}
}
```

---

## Embed API

| API                                                  | Package export               | Role                                                        |
| ---------------------------------------------------- | ---------------------------- | ----------------------------------------------------------- |
| `create(container, styleFunction, config, options?)` | `@mapsight/ui`               | Full UI mount — SPAs and custom hosts                       |
| `browserEmbed(container, options)`                   | `@mapsight/ui/embed/browser` | CMS embed bootstrap; reads optional `data-dehydrated-state` |

`browserEmbed` options shape:

```ts
{
	styleFunction: MapsightStyleFunction;
	baseMapsightConfig: object;
	createOptions ? : CreateOptions;
}
```

Preset factories in host apps (e.g. `simpleMap()`) return this object. The stable CMS `embed.js` entry re-exports
`browserEmbed` and pulls in stylesheet side effects — see [
`starters/mapsight-host-starter`](../../starters/mapsight-host-starter).

### v8 defaults

The v7 `createOptions.future` flags are removed. ARIA control tooltips,
expanding list search, and contextual headings are unconditional.
See the [v8 migration inventory](UI_V8_MIGRATION.md) for removed APIs and CSS migrations.

### `createOptions.headings`

Choose the first native heading rank inside the instance:

```ts
createOptions: {
	headings: {
		baseLevel: 2,
		overrides: {timeFilter: "div"},
	},
}
```

`baseLevel` accepts integers 1–6 and defaults to 2. Use 3 inside a host `h2` section.
Overrides accept `h1`–`h6`, `div`, or `p` by semantic slot. Explicit component element props take precedence.

For feature lists, change a fixed `uiState.list.renderGroupAs: "h3"` to `"auto"` to adopt contextual headings;
falsy values still disable grouping. `<Instance>` and default renderers share the same context. Supply identical
options during SSR and hydration. See the [heading guide](../../packages/ui/docs/HEADINGS.md) for slots, composition,
dialogs, limits, and migration.

### `createOptions.uiState.skipLinks`

Skip links are enabled by default at the start of the instance: "Zur Karte springen", "Zur Liste springen" and "Zur Suche springen"
(English: "Skip to the map / list / search"). Each appears only when its target is present and visible: a
keyboard-operable map, the feature list, the search input. They are hidden until they receive keyboard focus and are
the instance's first tab stops. Screen reader users also have the map and list landmarks; sighted keyboard users have
no browser shortcut for landmarks, so skip links are the way past the map controls.

```ts
createOptions: {
	uiState: {skipLinks: false}, // optional host opt-out
}
```

Set `false` explicitly to disable. The links render after hydration, so the server
markup is the same either way. Leave them off if the host page already provides equivalent skip links into the
instance.

---

## Validation (Zod)

| Export            | Path                                                                         |
| ----------------- | ---------------------------------------------------------------------------- |
| Full UI schema    | `packages/ui/src/js/config/schema/index.ts` → `mapsightConfigSchema`         |
| Per-slice schemas | `mapsightConfigSchemas` (same file)                                          |
| Runtime validate  | `validateMapsightConfig()` in `packages/ui/src/js/config/schema/validate.ts` |

In development, invalid config logs a Zod warning; production behaviour is host-defined.

---

## Examples

| Example                | Location                                                        |
| ---------------------- | --------------------------------------------------------------- |
| Rich demo config       | `apps/showcase/src/ui-demos/full-config.tsx`                    |
| Minimal test fixtures  | `packages/ui/src/js/config/__tests__/mapsight-config.test.ts`   |
| Host embed inline JSON | `starters/mapsight-host-starter` → `dist/snippets/` after build |

---

## Related

- [Getting started](../getting-started.md)
- [Publishing data](PUBLISHING_DATA.md)
- [CMS embed pattern](CMS_PHP.md)
- [SSR hydration](SSR_HYDRATION.md)
