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
