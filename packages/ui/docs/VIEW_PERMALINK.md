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
never touched. Longitudes of repeated worlds are written in the range −180…180.

### How values are read

Each parameter value is percent-decoded **once, as a whole**, and `+` counts as a space (the
query serialisation of `URLSearchParams`). For `layers` the decoded text is then split on
commas. A router that round-trips the address can therefore re-spell it without changing its
meaning: `layers=base,parks`, `layers=base%2Cparks` and `map=12%2F48%2F11` are read like
their plain forms, and an id such as `50%` is written `50%25`.

Because the comma is the separator, **a layer id that contains a comma cannot be represented.**
Such layers are never tracked: they are not written, and an address never changes their
visibility. Empty ids are treated the same way.

## Behaviour

- **Startup.** Right after the store exists, and before anything is mounted, the linked view
  and the layer visibility are applied to the state and the map. The map opens there instead
  of animating from the configured view. Only state named in the address is overridden.
- **Server-rendered pages.** The hydration snapshot (`context.serverState`) is captured
  before the plugin runs, so it holds the configured view, exactly as without the plugin;
  the linked view is applied afterwards. Components that render view values hydrate against
  the server's values and update to the linked ones right after. Layer visibility behaves
  the same way.
- **Layers.** With a `layers` parameter, tracked layers listed become visible and tracked
  layers not listed become hidden. Untracked layers are never touched, unknown ids are
  ignored and nothing is created from the address. The "only one base layer visible" rule of
  `@mapsight/core` applies: when the list names several tracked base layers, **the first one
  listed wins** and the others count as not listed. A switch to a tracked base layer is
  skipped if it would hide a visible untracked base layer.
- **Marker links.** A valid view parameter wins over a marker link (`#lm=…` of the share
  position link plugin): the marker is still placed, but the map is neither recentred nor
  zoomed. Without a usable view parameter (missing, malformed, out of range or disabled via
  `viewParameter: false`) the marker link behaves as before. The order of the two plugins in
  the plugin list does not matter. The view plugin tells the others through
  `context.initialViewFromAddress`, which plugins that move the map at startup can check.
- **Writing.** View and layer changes are written after a debounce with
  `history.replaceState`, never as new history entries, and only when the state changed and
  the address does not already say the same. Both parameters are written together. A layer
  list that cannot be represented (an id with a comma, or more than 4096 characters once
  encoded) is skipped: the `layers` parameter keeps its previous value and is written again
  as soon as the list fits.
- **Strict parsing.** Malformed or out-of-range values (zoom outside 0–28 or the configured
  view limits, latitude beyond ±90, longitude beyond ±180, unparsable numbers) are ignored,
  never clamped to a different place. Everything the plugin writes is accepted again when
  read.
- **Following.** Later `hashchange` and `popstate` events apply a changed address to the map
  (without animation, taking effect immediately), unless the address already holds what the
  plugin last read or wrote, in whatever percent-encoding. Back and forward reconcile the
  destination even when the permalink parameters match the previous entry. Traversal drops
  pending writes. Notifications within the adapter's write or its deferred commit are ignored.
- **Feature deep links.** Permalink writes update only the address. The default adapter
  preserves the history entry's state. Explicit feature navigation via history still
  applies. Back and forward prefer the feature query parameter over the entry's stored
  feature ID, as at startup. A feature ID can be selected before any source supplies
  it. A details view should handle an unresolved ID, including when its data was removed.
- **Server.** The plugin does nothing without a `window`.
- **Teardown.** The plugin lifecycle has no teardown phase. `destroy()` removes the listeners
  and subscriptions and cancels a pending write; call it when the instance goes away. It is
  safe to call more than once, and the plugin does nothing afterwards.

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
| `adapter`              | `window.location` + history | `An address reader and writer` for hosts whose router owns the address. See below.                                                                                                                                                                   |
| `followAddressChanges` | `true`                      | Apply later `hashchange` / `popstate` address changes.                                                                                                                                                                                               |

### Custom adapter

`read()` returns the parameter string of the configured location including its leading `#`
or `?` (empty when there is none). `write(next)` receives the complete next string in the
same form, with unrelated parameters preserved, and should replace the current history
entry. If the adapter defers the history mutation, call the supplied `commit` callback
around that mutation when it runs. This keeps the write from being treated as feature
navigation and lets traversal invalidate a queued commit. Synchronous adapters can
ignore the callback. With an adapter the plugin still listens to `hashchange` / `popstate` on `window` to
notice address changes; set `followAddressChanges: false` if the host applies them itself.

```ts
createViewPermalinkPlugin({
	location: "search",
	adapter: {
		read: () => router.currentSearch(),
		write: (next, commit) => {
			queueMicrotask(() => commit(() => router.replaceSearch(next)));
		},
	},
});
```

## Limitations

- Links use WGS84 longitude and latitude. Mapsight constructs the view in `EPSG:3857`,
  and the plugin uses the active OpenLayers user projection for public view coordinates
  when one is set, for example by `useGeographic()`.
- Layer ids that contain a comma (or are empty) are never tracked, and a list of visible
  layers longer than 4096 characters once encoded is not written (see above).
- Hosts that render view values server-side see the configured view in the server markup and
  the linked one only after hydration.
- Writes use `history.replaceState(history.state, …)`, so state set by other plugins stays
  on the entry.
