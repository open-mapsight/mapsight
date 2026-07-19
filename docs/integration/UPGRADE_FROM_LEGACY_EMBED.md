# Upgrade from legacy embed hosts

Short guide for host apps built against the pre–open-source Mapsight embed
shape (config bag + automatic default plugins). New hosts should keep using
the flat API in [CMS_PHP](CMS_PHP.md) and [OVERVIEW](OVERVIEW.md).

Legacy helpers below are **`@deprecated`**: keep using them while migrating,
but plan to drop them in the **next major** of each package (`@mapsight/ui`,
`@mapsight/core`, `@mapsight/lib-js`).

## Then vs now

| Historic                                                               | Current                                                       |
| ---------------------------------------------------------------------- | ------------------------------------------------------------- |
| `uiEmbed(styleFn, coreConfig, preset, uiState, embedOptions)` bag      | Flat `{ styleFunction, baseMapsightConfig, createOptions }`   |
| `browserEmbed(el, bag)` with `baseMapsightCoreConfig` / `embedOptions` | Same call; `browserEmbed` still accepts the bag               |
| `embedOptions.defaultPluginsOptions` auto-injected defaults            | Opt-in via `defaultPluginsOptions` or `useDefaultPlugins`     |
| `embedOptions.hook({ store, controllers })`                            | Same sugar, or a real `afterCreate` plugin                    |
| Process `EventEmitter` for partial DOM updates                         | `partialChangeHandler` / AppChannel (`partialContentChanged`) |

Deep `@mapsight/core/lib/*` imports remain the published API — no forced rewrite.

## Drop-in path

```js
import createEmbedBag from "@mapsight/ui/embed";
import browserEmbed from "@mapsight/ui/embed/browser";

const bag = createEmbedBag(styleFunction, coreConfig, {}, uiState, {
	defaultPluginsOptions: {/* same keys as createDefaultPlugins() */},
	hook({store, controllers}) {
		/* historic afterCreate sugar */
	},
	plugins: [["host", null]],
});

// Hosts may still mutate these after the factory:
bag.baseMapsightCoreConfig = {...bag.baseMapsightCoreConfig /* … */};
bag.embedOptions.renderer = myRenderer;

browserEmbed(container, bag);
```

`browserEmbed` prefers the **live** legacy fields when present, so reassignment
of `baseMapsightCoreConfig` / mutation of `embedOptions` keeps working.

## Modern flat path

```js
import browserEmbed from "@mapsight/ui/embed/browser";
import createDefaultPlugins from "@mapsight/ui/plugins/browser-defaults";

browserEmbed(container, {
	styleFunction,
	baseMapsightConfig: coreConfig,
	createOptions: {
		uiState,
		useDefaultPlugins: {/* optional plugin options */},
		// or: plugins: [...createDefaultPlugins(), ...hostPlugins],
		plugins: [["host", null]],
		partialChangeHandler(event) {
			/* update charts / partial HTML outside React */
		},
	},
});
```

## Partial-content events

Historic hosts listened on a process bus for `page-partial-content-changed`.

| Approach                     | Module / option                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| Legacy bag + default plugins | Auto-bridges `@mapsight/ui/helpers/global-event-hub` (emits historic + modern names) |
| Explicit                     | `createOptions.partialChangeHandler`                                                 |
| Inside React                 | AppChannel `APP_EVENT_PARTIAL_CONTENT_CHANGED` (`partialContentChanged`)             |

```js
import hub, {
	EVENT_PARTIAL_CONTENT_CHANGED,
} from "@mapsight/ui/helpers/global-event-hub";

hub.on(EVENT_PARTIAL_CONTENT_CHANGED, () => {
	/* refresh host widgets in the embed DOM */
});
```

## Other restored entry points

| Import                                               | Notes                                    |
| ---------------------------------------------------- | ---------------------------------------- |
| `@mapsight/ui/components/feature-list/filtering`     | `filterFeatures`                         |
| `@mapsight/ui/components/feature-list/with-keyboard` | Historic list keyboard HOC               |
| `@mapsight/ui/components/feature-list`               | Directory index (no `/index` suffix)     |
| `@mapsight/ui/components/tag-switcher`               | Directory index                          |
| `@mapsight/ui/components/contexts`                   | Typedef alias for `MapsightUiComponents` |
| `@mapsight/lib-js/types/is-numeric`                  | Alias of `isNumberLike`                  |

## Host layout component slots

These `createOptions.components` keys are wired again for legacy hosts:

| Key                          | Where it mounts                                                     |
| ---------------------------- | ------------------------------------------------------------------- |
| `AppWrapperStart`            | Start of the app wrapper (typical mobile chrome)                    |
| `AdditionalContainerContent` | Additional-container body (list region; often hosts routing)        |
| `MainPanelContainer`         | Inner replace of the main panel (panel chrome / width classes stay) |
| `MapWrapper`                 | Wraps map children inside the size/scroll shell                     |

Related runtime shims (also deprecated):

| Surface                                                         | Prefer instead                                      |
| --------------------------------------------------------------- | --------------------------------------------------- |
| `controller.reduce(slice, action, globalState)` 3rd arg         | Selectors / `getStore()` after controller `init()`  |
| Presentational `ListToggleButton` (`active` + `onClick`)        | `MainPanelListToggleButton` or a host-owned control |
| Extra `ms3-flex*` classes on `MapRow` / `MainContainer`         | Theme SCSS layout                                   |
| `MapController.setDefaultStyleEnv` patches merge into prior env | Keep calling; merge behavior matches historic Redux |

## FeatureList `itemAs` and `overrideListHtml`

Historic hosts pass a custom **row wrapper** via `itemAs` (e.g. an `<li>` +
`<a>` that deep-links into a topic). That component is **not** a full list-item
replacement: Mapsight still renders `FeatureListItem` and sets `itemAs` as its
`as` prop so icon / title / details stay intact.

When a feature has `properties.overrideListHtml` (or the property named by
`properties.__overrideListHtmlProp`), that HTML is applied on the **wrapper**
via `dangerouslySetInnerHTML`. Host wrappers that forward props onto an `<a>`
must not also pass React `children` in that case (React forbids mixing the two).

`@mapsight/lib-js` `getPath` returns the `defaultValue` when the resolved value
is `undefined` (including a missing final key), which is how
`__overrideListHtmlProp` falls back to `overrideListHtml`.

## Deprecation / removal

All of the above legacy helpers are marked `@deprecated` in source. They remain
supported through the current major lines so hosts can migrate incrementally.
Expect removal in the **next major** of the owning package. `@mapsight/lib-js`
itself is on a longer sunset path; prefer `@mapsight/lib-js` modern helpers
(and eventually package successors) rather than new `is-numeric` imports.

## See also

- [CMS embed pattern](CMS_PHP.md)
- [Integration overview](OVERVIEW.md)
- [SSR hydration](SSR_HYDRATION.md)
