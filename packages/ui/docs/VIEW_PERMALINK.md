# View permalink plugin

`@mapsight/ui/plugins/browser/view-permalink` keeps the map view and the visibility of
layers in the page address, so a copied link reopens the same view. It is opt-in and
not part of the default browser plugins.

```ts
import {create} from "@mapsight/ui";
import createDefaultPlugins from "@mapsight/ui/plugins/browser-defaults";
import createViewPermalinkPlugin from "@mapsight/ui/plugins/browser/view-permalink";

const viewPermalink = createViewPermalinkPlugin();

create(container, styleFunction, config, {
	plugins: [...createDefaultPlugins(), ["viewPermalink", viewPermalink]],
});

// The plugin lifecycle has no teardown phase: call this when the instance goes away.
viewPermalink.destroy();
```

## URL format

```
https://example.org/page#map=12.5/52.26471/10.52368&layers=base,parks
https://example.org/page#map=12.5/52.26471/10.52368/45
```

| Parameter | Value                                                                                          |
| --------- | ---------------------------------------------------------------------------------------------- |
| `map`     | `zoom/lat/lon[/rotation]`. WGS84 degrees, zoom with 2 decimals, coordinates with 5 by default. |
| `layers`  | Comma-separated ids of the visible tracked layers. Ids are percent-encoded.                    |

`rotation` is the clockwise angle in degrees and only appears when it is not zero. An empty
`layers=` means every tracked layer is hidden. Other parameters in the hash or query are
never touched.

## Behaviour

- **Startup.** The linked view is placed in the initial state before the map is created, so
  the map starts there instead of animating from the configured view. Layer visibility is
  applied right after the store exists, before the first render. Only state named in the
  address is overridden.
- **Layers.** With a `layers` parameter, tracked layers listed become visible and tracked
  layers not listed become hidden. Untracked layers are never touched, unknown ids are
  ignored and nothing is created from the address. The "only one base layer visible" rule of
  `@mapsight/core` applies.
- **Writing.** View and layer changes are written after a debounce with
  `history.replaceState`, never as new history entries, and only when the state changed and
  the address does not already say the same. Both parameters are written together.
- **Strict parsing.** Malformed or out-of-range values (zoom outside 0–28 or the configured
  view limits, latitude beyond ±90, longitude beyond ±180, unparsable numbers) are ignored,
  never clamped to a different place.
- **Following.** Later `hashchange` and `popstate` events apply a changed address to the map
  (without animation), unless the address already holds what the plugin last read or wrote.
- **Server.** The plugin does nothing without a `window`.

## Options

All options are optional.

| Option                 | Default                     | Description                                                                                                                                                                                                                                          |
| ---------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mapControllerName`    | `"map"`                     | Map controller to read and drive.                                                                                                                                                                                                                    |
| `viewParameter`        | `"map"`                     | Parameter name for the view. `false` disables the view.                                                                                                                                                                                              |
| `layersParameter`      | `"layers"`                  | Parameter name for the layers. `false` disables the layers.                                                                                                                                                                                          |
| `location`             | `"hash"`                    | `"hash"` or `"search"`: where the parameters are stored.                                                                                                                                                                                             |
| `trackedLayers`        | layers shown in a switcher  | Array of layer ids or a `(id, layer) => boolean` predicate. The default tracks layers with `metaData.visibleInLayerSwitcher` or `visibleInExternalLayerSwitcher` that are neither `lockedInLayerSwitcher` nor derived through `visibleWhenLayerIds`. |
| `debounceMs`           | `250`                       | Delay before state changes are written.                                                                                                                                                                                                              |
| `precision`            | `5`                         | Decimals for latitude and longitude (0–10).                                                                                                                                                                                                          |
| `adapter`              | `window.location` + history | `{read(): string; write(next: string): void}` for hosts whose router owns the address. See below.                                                                                                                                                    |
| `followAddressChanges` | `true`                      | Apply later `hashchange` / `popstate` address changes.                                                                                                                                                                                               |

### Custom adapter

`read()` returns the parameter string of the configured location including its leading `#`
or `?` (empty when there is none). `write(next)` receives the complete next string in the
same form, with unrelated parameters preserved, and should replace the current history
entry. With an adapter the plugin still listens to `hashchange` / `popstate` on `window` to
notice address changes; set `followAddressChanges: false` if the host applies them itself.

```ts
createViewPermalinkPlugin({
	location: "search",
	adapter: {
		read: () => router.currentSearch(),
		write: (next) => router.replaceSearch(next),
	},
});
```

## Limitations

- At startup the view is converted with proj4 from WGS84 to the configured
  `map.view.projection` (default `EPSG:3857`). A projection that proj4 does not know yet at
  that point leaves the configured view in place.
- Writes use `history.replaceState(history.state, …)`, so state set by other plugins stays
  on the entry.
