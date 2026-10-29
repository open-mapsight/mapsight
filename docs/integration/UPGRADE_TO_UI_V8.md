# Upgrade @mapsight/ui from v7 to v8

This guide covers the breaking changes implemented in the **v8 draft**. The release
date and final scope are still undecided; it does not announce an available npm
release. For proposed removals that are still under discussion, see the
[v8 preparation inventory](UI_V8_MIGRATION.md#decisions-still-open-before-the-cut).

## 1. Prepare the host on v7

Before changing the major version, migrate to the flat embed API and supported
imports below. On a v7 version that provides them, enable all three future flags
and the themed-icon Sass flag to preview the v8 behavior:

```ts
const createOptions = {
	future: {
		v8_ariaControlTooltip: true,
		v8_listSearchButton: true,
		v8_automaticHeadings: true,
	},
	headings: {baseLevel: 2},
	uiState: {skipLinks: true},
};
```

Build and review a representative page with your real host CSS. Check the full
page heading outline, list search, keyboard navigation, and custom icon assets.
A host already using the v8 behavior still needs to delete the flags when it
moves to v8: the old keys and compatibility APIs no longer exist.

When v8 is published, update the host's `@mapsight/ui` dependency and lockfile,
and resolve directly installed `@mapsight/*` packages against the published
release's dependency ranges. The version numbers of core, UI, and add-ons do not
need to match. Rebuild both server and browser bundles, plus the host stylesheet;
do not combine v7 SSR markup or CSS with a v8 client bundle.

The repository starters remain pinned to published v7 packages during this draft.
Treat their dependency pins as v7 examples until the release updates them.

## 2. Replace legacy embed bags and hooks

If the host already passes `{styleFunction, baseMapsightConfig, createOptions}`
to `browserEmbed`, keep that shape. Legacy bags, the default export from
`@mapsight/ui/embed`, and `createEmbedBag` are removed.

Before, on v7:

```ts
import createEmbedBag from "@mapsight/ui/embed";
import browserEmbed from "@mapsight/ui/embed/browser";

const bag = createEmbedBag(styleFunction, coreConfig, {}, uiState, {
	defaultPluginsOptions: pluginOptions,
	hook(context) {
		initializeHost(context);
	},
});
bag.baseMapsightCoreConfig = resolvedConfig;
browserEmbed(container, bag);
```

After, on v7 or v8:

```ts
import type {BrowserEmbedOptions} from "@mapsight/ui/embed";
import browserEmbed from "@mapsight/ui/embed/browser";

const options: BrowserEmbedOptions = {
	styleFunction,
	baseMapsightConfig: resolvedConfig,
	createOptions: {
		uiState,
		useDefaultPlugins: pluginOptions,
		plugins: [["host", {afterCreate: initializeHost}]],
	},
};
browserEmbed(container, options);
```

`useDefaultPlugins: true` uses default plugin options; an options object configures
them. An omitted or `false` value keeps plugin registration explicit. Host plugins
run after the prepended defaults.

Move `embedOptions` into `createOptions` and `embedUiState` into
`createOptions.uiState`. Resolve any host preset/config merges before the call;
there is no automatic precedence between live bag fields and their mirrored
values anymore. Remove `LegacyEmbedBag`, `LegacyEmbedOptions`, `BrowserEmbedInput`,
`normalizeBrowserEmbedOptions`, and `legacyBagToBrowserEmbedOptions` imports.

### Replace the global partial-content event hub

Remove subscriptions to `helpers/global-event-hub` and
`EVENT_PARTIAL_CONTENT_CHANGED` (`page-partial-content-changed`). Events now stay
with their Mapsight instance. For a callback that refreshes host widgets:

```ts
const createOptions = {
	useDefaultPlugins: true,
	partialChangeHandler(event: Event) {
		refreshHostWidgets(event);
	},
};
```

`browserEmbed` registers the partial-content event plugin when defaults are
requested. If you build an explicit plugin list or use `create()` directly,
register `@mapsight/ui/plugins/browser/partial-content-changed-event` explicitly
for `partialChangeHandler` to run. Alternatively, subscribe directly through
`createOptions.appChannelListeners` using `APP_EVENT_PARTIAL_CONTENT_CHANGED`
from `@mapsight/ui/app-channel`; that needs no callback-bridging plugin. Remove
`createHubPartialChangeHandler`: v8 has no process-wide event bridge.

## 3. Delete future flags and configure heading placement

On v8, remove the entire `future` object from create options, renderer props,
and custom `AppContext` usage. Remove `FutureFlags`, `FutureFlagsContext`, and
`useFutureFlag` imports. Setting an old flag to `false` cannot restore v7 behavior.

Keep page-outline preferences:

```ts
const createOptions = {
	headings: {baseLevel: 3}, // first Mapsight heading below a host h2
	uiState: {
		pageTitle: {show: false}, // the host supplies the title
		list: {renderGroupAs: "auto"},
	},
};
```

`baseLevel` defaults to 2. An enabled, nonempty Mapsight title (`pageTitle.show`) takes that rank and
advances its content one rank. Change a fixed `renderGroupAs: "h3"` to `"auto"`
if list groups should follow their surrounding section. Explicit tags remain
explicit; falsy grouping values continue to disable grouping.

For custom React composition:

- Remove `enabled` from `HeadingsProvider`; it always resolves contextual headings.
- Replace `<Heading fallbackAs="h3">` with `<Heading>` for a contextual rank,
  or `<Heading as="h3">` to deliberately keep a fixed element.
- Replace `useHeadingLevel(3)` with `useHeadingLevel()` and
  `useHeadingElement("switcher", "h3", explicitAs)` with
  `useHeadingElement("switcher", explicitAs)`.
- Remove branches using `useAutomaticHeadings`; automatic headings are unconditional.
- Keep forwarding supplied `headlineAs` and `id` props from replacement headers.

Use the **same `headings` options on server and client**; they are not serialized
in `data-dehydrated-state`. Custom renderers should pass renderer props into
`AppContext` on both sides. Review CSS targeting fixed `h2`/`h3` tags and prefer
component classes where the style is independent of heading rank.
See [Heading hierarchy](../../packages/ui/docs/HEADINGS.md) for scopes and overrides.

## 4. Recompile styles and migrate tooltips

Delete `$ms3-future-v8-themedIcons` from Sass `with` blocks. Chrome icons always
use CSS masks filled from theme tokens:

```scss
@use "@mapsight/ui/src/scss/variables" with (
	$ms3-iconPath: "~@mapsight/ui/dist/img/"
);
@use "@mapsight/ui/src/scss/default";
```

Keep your bundler's existing asset-path convention. Remove `$ms3-hintPrefix`,
`$ms3-hintFontFamily`, `$ms3-hintDefaultColor`, `--ms3-hint-*` overrides, and imports
of `blocks/hint`. You can remove a host's direct `hint.css` dependency once its
v7 Mapsight styles and any independent hint.css usage are gone.

Custom chrome icons now contribute only their shape; multicolour artwork needs a
separate rendering approach. Serve masks from the page origin, as data URIs, or
with CORS headers. Overrides that used `background-image` must target the mask's
actual box and set `mask-image` / `-webkit-mask-image`; some controls draw that
box on a pseudo-element. See [Themed chrome icons](../../packages/ui/README.md#themed-chrome-icons)
for box locations, token overrides, and forced-colors behavior.

Replace a host's `HintTooltip` or `ms3-hint--*` usage with `Tooltip`. Name the
trigger itself rather than relying on tooltip text as its accessible name:

```tsx
import Tooltip from "@mapsight/ui/components/tooltip";

<Tooltip text="Center map on a region" placement="right">
	<button
		type="button"
		aria-label="Center map on a region"
		onClick={centerMap}
	>
		<span aria-hidden="true">⌖</span>
	</button>
</Tooltip>;
```

RegionSelector already uses this tooltip path. Recheck host layout rules that
relied on the extra `ms3-flex*` classes formerly emitted by MapRow and
MainContainer; style `ms3-map-row` / `ms3-main-container` or use the supplied theme.

## 5. Migrate list rows and search behavior

`overrideListHtml` and `__overrideListHtmlProp` no longer inject a custom HTML row.
Move presentation data into standard feature properties and use React composition
when default content is insufficient:

```ts
// Before: a CMS-generated row string.
const oldProperties = {overrideListHtml: "<strong>Library</strong>"};

// After: data for the standard FeatureListItem and its native selection button.
const properties = {name: "Library", listInformation: "Open today"};
```

`itemAs` remains a **row wrapper**, not a full item replacement. Low-level
`FeatureListItem` also exposes `headAs` / `contentAs` composition props.
Replace `withKeyboard` with FeatureList's internal navigation
(`enableKeyboardControl`) and use
`components/feature-list/hooks/useSelectFeature` for custom React selection
controls. The hook must run inside a Mapsight instance's Redux/AppChannel context.

List search now starts as a labeled button. Opening it focuses the search field;
an existing query starts expanded. Update CSS and host automation that assumed
an always-visible label/input. The search field's reset clears its query; the
list-options popover's reset clears tags and custom sorting **without clearing
search**, and its active-filter count excludes the query.

## 6. Update remaining imports and types

All paths below are relative to `@mapsight/ui/`:

| Old import                                                        | Supported import / replacement                                                                                                   |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `components/contexts`                                             | `helpers/components` (`MapsightUiComponents`, context helpers)                                                                   |
| `components/helping/app-channel`                                  | `app-channel`                                                                                                                    |
| `components/feature-list/filtering`                               | Named `filterFeatures` from `components/feature-list/hooks/usePaginatedFilteredFeatures`                                         |
| `components/feature-list-item/DistanceLabel`                      | `components/distance-label`                                                                                                      |
| `components/place-actions/supports-geo-protocol`                  | Named helpers from `helpers/geo-protocol`                                                                                        |
| `hooks/useMapViewportSyncForBottomSheet`                          | Default `useMapViewportSync` from `hooks/useMapViewportSync`; use `UseMapViewportSyncOptions` / `UseMapViewportSyncResult` types |
| Coordinate formatting exports from `plugins/browser/marked-point` | `formatLonLat`, `formatCoordinateSpellings`, `CoordinateSpellings` from `helpers/coordinates`                                    |
| Default `filters/tag-filter` singleton                            | Named `createTagFilterFunction`; create one filter per Mapsight instance                                                         |
| Named/default `ListToggleButton`                                  | Named `MainPanelListToggleButton` inside the main-panel context, or a host-owned control                                         |

Replace `MapsightCoreState` with core `State` for runtime state or UI `MapsightConfig`
from `@mapsight/ui/config/schema` for config input. Replace `MapsightCoreReducer`
with Redux `Reducer<S, MapsightCoreAction>` for a concrete slice type.
`MapsightUiAppReducer` remains available.

Deprecated overlay fallback and layout-slot APIs are retained in this draft;
check the [open scope decisions](UI_V8_MIGRATION.md#decisions-still-open-before-the-cut)
before migrating those integrations. Core/lib-js deprecations follow their own
major releases; deep core imports remain supported.

## 7. Verify the complete host before deploying

- [ ] Remove obsolete keys from JavaScript configuration as well as typed objects;
      TypeScript excess-property checks do not catch every shared config object.
- [ ] Clean-build the host and linked UI packages, and clear bundler caches when
      switching linked checkouts. See [Linked host apps](../development/LINKED_HOST_APPS.md).
- [ ] Hydrate a freshly rendered page without mismatches; test several embeds with
      different heading base levels on the same page.
- [ ] Inspect the full page heading outline with details, dialogs, and sheets open.
- [ ] Test list search open/clear/Escape, tag/sort reset, row selection and arrow
      navigation, and host partial-content callbacks.
- [ ] Tab through skip links and their map/list/search destinations. They are
      enabled by default when targets are available; set `uiState.skipLinks: false`
      explicitly if the host supplies equivalent navigation.
- [ ] Test tooltips with keyboard and pointer; inspect custom icons and contrast
      in normal and forced-colors modes.
- [ ] Deploy matching browser JS, CSS, and server-rendering bundles together;
      invalidate cached SSR fragments from the previous major.
