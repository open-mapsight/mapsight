# UI v8 preparation and migration inventory

Status: draft implementation; release date undecided. This branch is a review
of the next major, not a change suitable for a 7.x patch or minor release.
Keep the PR in draft until the scope and host migrations have been agreed.
The major Changeset belongs to the eventual v8 cut; merging this branch makes
it eligible for the normal Changesets release workflow.

## Behavior changes implemented in the draft

| 7.x opt-in                        | v8 behavior / host action                                                                                                                                                                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `future.v8_ariaControlTooltip`    | RegionSelector always uses the ARIA `Tooltip`. Remove the flag and any `ms3-hint--*` CSS.                                                                                                                                                                    |
| `future.v8_listSearchButton`      | List search always expands from a labeled button. Update selectors/layout that expect a visible label and input. Search has its own reset; the list-options reset clears tags and sorting, leaving the query intact.                                         |
| `future.v8_automaticHeadings`     | Native heading ranks always follow `headings.baseLevel` (default 2) and subtree scopes. Remove the flag; keep the same `headings` options on server and client. Audit CSS targeting fixed h2/h3 elements.                                                    |
| Sass `$ms3-future-v8-themedIcons` | Chrome icons always use CSS masks and theme tokens. Remove the variable from Sass `with` blocks. Custom multi-colour chrome assets become single-colour; cross-origin masks need CORS. See the [UI README](../../packages/ui/README.md#themed-chrome-icons). |
| `uiState.skipLinks: true`         | Skip links are enabled by default when their targets are available. Set `false` explicitly to disable. This was a planned v8 default, not a `FutureFlags` entry.                                                                                             |

`FutureFlags`, `createOptions.future`, renderer/AppContext `future`, and the
future context/hook are removed. An old JavaScript `false` flag does not restore
7.x behavior. Unknown excess properties may escape TypeScript checks when passed
through variables, so remove them from shared host config as well.

The heading API also loses its compatibility switches: `HeadingsProvider.enabled`,
`Heading.fallbackAs`, `useAutomaticHeadings`, and the legacy fallback argument of
`useHeadingLevel` / `useHeadingElement`. Use explicit `as` / `headlineAs` or slot
overrides for exceptions. For example, `useHeadingElement("switcher", "h3", as)`
becomes `useHeadingElement("switcher", as)`. See [heading composition](../../packages/ui/docs/HEADINGS.md).

## Compatibility APIs removed in the draft

| Removed surface                                                                                                                                                 | Migration                                                                                                                                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default `@mapsight/ui/embed` factory / named `createEmbedBag`                                                                                                   | Pass `{styleFunction, baseMapsightConfig, createOptions}` directly to `browserEmbed`. `@mapsight/ui/embed` now exports types only.                                                                                                       |
| `LegacyEmbedBag`, `LegacyEmbedOptions`, `BrowserEmbedInput`, `normalizeBrowserEmbedOptions`, `legacyBagToBrowserEmbedOptions`, `embed/normalize-legacy-options` | Use `BrowserEmbedOptions` from `@mapsight/ui/embed`; merge any preset and UI state explicitly before calling. No legacy field precedence remains.                                                                                        |
| `baseMapsightCoreConfig`, `embedOptions`, `embedUiState`, bag `preset`                                                                                          | Use `baseMapsightConfig` and `createOptions.uiState`. Old bag fields are no longer read.                                                                                                                                                 |
| `createOptions.defaultPluginsOptions`                                                                                                                           | Use `useDefaultPlugins: options` (still supported), or explicit `plugins`.                                                                                                                                                               |
| `createOptions.hook`                                                                                                                                            | Register a named `plugins` entry with an `afterCreate` callback. This historic sugar is removed together with the bag.                                                                                                                   |
| `helpers/global-event-hub`, `EVENT_PARTIAL_CONTENT_CHANGED`, `createHubPartialChangeHandler`                                                                    | Use `partialChangeHandler` or the instance AppChannel. There is no automatic process-wide event bridge.                                                                                                                                  |
| `components/feature-list-item/legacy-override-list-html`, feature properties `overrideListHtml` / `__overrideListHtmlProp`                                      | Use standard typed list content and native selection controls. `itemAs` remains a wrapper, not a complete row replacement. `headAs` / `contentAs` are explicit FeatureListItem composition points. Old properties no longer inject HTML. |
| `components/feature-list/with-keyboard`, `components/feature-list/create-select-feature`                                                                        | Use FeatureList's internal keyboard navigation and `components/feature-list/hooks/useSelectFeature`.                                                                                                                                     |
| `components/feature-list/filtering`                                                                                                                             | Import `filterFeatures` from `components/feature-list/hooks/usePaginatedFilteredFeatures`.                                                                                                                                               |
| `components/contexts`                                                                                                                                           | Import `MapsightUiComponents` and component context helpers from `helpers/components`.                                                                                                                                                   |
| `components/helping/app-channel`                                                                                                                                | Import from `app-channel`. The in-repo count-aggregator consumer is migrated.                                                                                                                                                            |
| `components/feature-list-item/DistanceLabel`                                                                                                                    | Import from `components/distance-label`.                                                                                                                                                                                                 |
| `components/place-actions/supports-geo-protocol`                                                                                                                | Import from `helpers/geo-protocol`.                                                                                                                                                                                                      |
| `hooks/useMapViewportSyncForBottomSheet` and its type aliases                                                                                                   | Use `hooks/useMapViewportSync` and `UseMapViewportSyncOptions` / `UseMapViewportSyncResult`.                                                                                                                                             |
| Coordinate formatting re-exports from `plugins/browser/marked-point`                                                                                            | Import `formatLonLat`, `formatCoordinateSpellings`, `CoordinateSpellings` from `helpers/coordinates`.                                                                                                                                    |
| `MapsightCoreState`, `MapsightCoreReducer` from UI types                                                                                                        | Use core `State`, UI `MapsightConfig` from `config/schema`, or Redux `Reducer<S, MapsightCoreAction>` with a concrete slice type. `MapsightUiAppReducer` remains.                                                                        |
| Default singleton export from `filters/tag-filter`                                                                                                              | Create a filter per instance with named `createTagFilterFunction`.                                                                                                                                                                       |
| Named/default `ListToggleButton` and its props type                                                                                                             | Use named `MainPanelListToggleButton` inside its panel context, or a host-owned button. Its presentational implementation remains private.                                                                                               |
| `components/hint-tooltip`, Sass `blocks/hint`, `$ms3-hint*`, `--ms3-hint-*`, `hint.css` dependency                                                              | Use `components/tooltip`; provide an accessible name on the trigger itself.                                                                                                                                                              |
| Extra `ms3-flex*` classes on MapRow / MainContainer                                                                                                             | Use the supplied layout theme or host layout rules on `ms3-map-row` / `ms3-main-container`. The components remain.                                                                                                                       |

Example flat embed with a host plugin:

```ts
import browserEmbed from "@mapsight/ui/embed/browser";

browserEmbed(container, {
	styleFunction,
	baseMapsightConfig,
	createOptions: {
		uiState,
		headings: {baseLevel: 2},
		useDefaultPlugins: true,
		plugins: [
			[
				"host",
				{
					afterCreate(context) {
						/* host setup */
					},
				},
			],
		],
		partialChangeHandler(event) {
			/* refresh host widgets */
		},
	},
});
```

`useDefaultPlugins` still registers the partial-content event plugin. Hosts using
an explicit plugin list must include that plugin themselves if they need
`partialChangeHandler` (or dispatch the AppChannel event themselves).

## Decisions still open before the cut

These are deliberately retained in this first draft. Removing them requires a
concrete composition contract and host adoption, rather than deleting a type
or import alias:

- Deprecated overlay fallback API: `ComponentPropsWithFallback`,
  `useContextComponentWithFallback`, and the seven `MapOverlay*` slots in
  `helpers/components` / `components/app`. Decide whether to replace `fallback`
  with children, define new typed overlay slots, or require a fully composed app.
  This API still runs the built-in control fallback and host customizations.
- Deprecated layout slots in `components/layout/host-slots`,
  `components/layout/additional-container/content`, `components/map-wrapper`,
  and `components/main-panel/container`: decide which slots stay public and how
  hosts mount routing content and overlays. Keep wrapper sizing, scroll behavior,
  and panel chrome intact when changing their extension points.
- Possible dependency cleanups: migrate remaining `react-modal` callers to the
  native dialog API, replace flatpickr/time-filter integration, and reduce
  `@mapsight/lib-js` / `@mapsight/lib-redux` dependencies. These are larger
  implementation changes, not currently documented UI removals.
- Historic `window.simplejs` tracking and mutable `siteConfig` remain. Agree on
  replacement contracts before including them in v8 scope.
- Core/lib-js deprecations (for example controller reducer signatures and
  `is-numeric`) belong to those packages' own major versions. UI v8 alone does
  not authorize deleting them. Deep core imports remain supported.
- Unmerged work can introduce more next-major flags (for example themed
  surfaces); re-run the inventory against main immediately before the cut.

## Before leaving draft

- [ ] Agree which of the open removals above belong in v8; implement or explicitly defer each.
- [ ] Test representative CMS, custom-layout, SSR, and linked host apps against this branch.
- [ ] Review heading outlines, skip-link focus targets, tooltip keyboard behavior, search reset, custom icon assets and forced-colors presentation.
- [ ] Clean-build UI so deleted modules cannot survive in `dist` and leak into a tarball.
- [ ] Rebase on current main and re-inventory `v8_`, Sass future flags, and `@deprecated` APIs.
- [ ] Confirm the major Changeset and downstream package releases/pins match the final scope. The starters stay pinned to published 7.x packages in this draft; remove their direct `hint.css` dependencies when their pins move to v8.
- [ ] Choose the release window; do not merge this draft into the automatic release pipeline beforehand.
