# @mapsight/ui

![Mapsight UI (@mapsight/ui): Composable React UI. Work in progress; used in controlled production deployments, not yet turnkey.](https://raw.githubusercontent.com/open-mapsight/mapsight/main/docs/assets/brand/ui-npm-header-en.png)

Default **React UI** for [Mapsight](https://github.com/open-mapsight/mapsight) — maps, feature lists, filters, layer
switchers, and embed helpers on top of [
`@mapsight/core`](https://github.com/open-mapsight/mapsight/blob/main/packages/core/README.md). Pass a compiled vector
`styleFunction` (typically from [
`@mapsight/traffic-style`](https://github.com/open-mapsight/mapsight/blob/main/packages/traffic-style/README.md) or your
own [
`@mapsight/vector-style-compiler`](https://github.com/open-mapsight/mapsight/blob/main/packages/vector-style-compiler/README.md)
build), a declarative config object, and `create()` mounts the Redux-backed GIS runtime into a DOM container.

See the [documentation hub](https://github.com/open-mapsight/mapsight/blob/main/docs/README.md) for architecture,
integration patterns, and licensing.

## Quick start

```ts
import styleFunction from "@mapsight/traffic-style/default";
import {create} from "@mapsight/ui";

// Declarative layer/view/list config — builders in @mapsight/ui/config
import mapsightConfig from "./mapsight-config";

create(document.getElementById("map"), styleFunction, mapsightConfig);
```

Copy a working config from [
`apps/showcase/src/ui-demos/full-config.tsx`](https://github.com/open-mapsight/mapsight/blob/main/apps/showcase/src/ui-demos/full-config.tsx).

Runnable apps: [`apps/showcase`](https://github.com/open-mapsight/mapsight/tree/main/apps/showcase) (full UI demo) and [
`starters/mapsight-host-starter`](https://github.com/open-mapsight/mapsight/tree/main/starters/mapsight-host-starter) (
host embed), [
`starters/mapsight-next-starter`](https://github.com/open-mapsight/mapsight/tree/main/starters/mapsight-next-starter) (
Next.js host).

## Package layout

| Import                                 | Role                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------ |
| `@mapsight/ui`                         | `create()`, React components, plugins, hooks                                   |
| `@mapsight/ui/config`                  | Config builders (`map`, `features`, `featureList`, Zod schemas)                |
| `@mapsight/ui/headings`                | Contextual native headings and scopes for host-composed UI                     |
| `@mapsight/ui/async-status`            | Loading / error / empty view model + adapters (no Query peer)                  |
| `@mapsight/ui/async-status/components` | `AsyncStatusRegion`, `AsyncStatusIndicator`                                    |
| `@mapsight/ui/react-query`             | TanStack Query adapters (`QueryStatusRegion`) — optional peer                  |
| `@mapsight/ui/embed/browser`           | CMS embed bootstrap (`browserEmbed`, hydration from `data-dehydrated-state`)   |
| `@mapsight/ui/embed/node`              | SSR entry (`nodeEmbed`): HTML shell + `emitFragment` / `data-dehydrated-state` |
| `@mapsight/ui/components/tooltip`      | Hover/focus tooltip for host controls (accessible name stays on the control)   |

Peer dependency: `react`, `react-dom`. Optional peer for Query helpers: `@tanstack/react-query`.

Loading/error presentation architecture:
[docs/ASYNC_STATUS.md](https://github.com/open-mapsight/mapsight/blob/main/packages/ui/docs/ASYNC_STATUS.md).

## Heading hierarchy

For headings that fit the host page, set `future.v8_automaticHeadings: true` and `headings.baseLevel` on create
options (`2` beneath the host's `h1`). Without the flag, existing 7.x heading elements remain. See
[Heading hierarchy](https://github.com/open-mapsight/mapsight/blob/main/packages/ui/docs/HEADINGS.md) for composed
hosts, explicit overrides, list grouping, and SSR configuration.

## Hydration

The browser embed renderer and `<Instance>` run `afterRender` plugins after React commits. Asynchronous host renderers
call `props.deferCommit()` before scheduling React and pass the returned callback to `AppContext.onCommit`. Spread
`props.serverState` into `AppContext` to pin React-Redux's hydration snapshot. Synchronous custom renderers retain
completion on return. See [SSR and hydration](https://github.com/open-mapsight/mapsight/blob/main/docs/integration/SSR_HYDRATION.md#renderer-commit-lifecycle)
for the contract and migration example.

## SCSS (host builds)

The npm package includes `src/scss/` (variables, reset, default theme partials). Host apps compile their own stylesheet
with Sass. Point `$ms3-iconPath` at `@mapsight/ui/dist/img/` so your bundler resolves UI chrome icons (`mapsight-ui/*`)
as assets (Vite/Webpack `~` alias — see starters and [
`apps/showcase`](https://github.com/open-mapsight/mapsight/tree/main/apps/showcase)):

```scss
@use "@mapsight/ui/src/scss/variables" with (
	$ms3-iconPath: "~@mapsight/ui/dist/img/"
);
@use "@mapsight/ui/src/scss/default";
@use "@mapsight/ui/src/scss/themes/2022-03" as theme;
```

### CSS design tokens (`--ms3-*`)

`default` loads `src/scss/_tokens.scss`, which mirrors configured Sass variables as CSS custom
properties (colors, type sizes, radii, z-indexes, scrollbar tokens, and similar). Prefer
`var(--ms3-…)` for new CSS-only styles and easy property values in UI SCSS. Compile-time options
(`$ms3-option-*`), breakpoints, and icon path concatenation stay as Sass for now.

**Where tokens are emitted** is controlled by `$ms3-tokens-selector` (configured with the other
variables):

| Value               | Behavior                                                                             |
| ------------------- | ------------------------------------------------------------------------------------ |
| `":root"` (default) | Document-wide defaults. Use when host chrome or portals live outside `.ms3-wrapper`. |
| `".ms3-wrapper"`    | Tokens only on each Mapsight root — better when several instances share a page.      |
| `null`              | No automatic emission; call the mixin yourself (see below).                          |

```scss
@use "@mapsight/ui/src/scss/variables" with (
	$ms3-iconPath: "~@mapsight/ui/dist/img/",
	$ms3-tokens-selector: ".ms3-wrapper"
);
@use "@mapsight/ui/src/scss/default";
```

**Mixin for custom scopes / multiple themes.** The compiled Sass config is still one set of values
per stylesheet, but you can attach that set (or pure CSS overrides) to different selectors:

```scss
@use "@mapsight/ui/src/scss/variables" with (
	$ms3-tokens-selector: null // disable auto-emit from default/tokens
);
@use "@mapsight/ui/src/scss/default";
@use "@mapsight/ui/src/scss/tokens" as msTokens;

.ms3-wrapper {
	@include msTokens.tokens;
}

// Further themes: override tokens on a modifier (inherits from the wrapper include above)
.ms3-wrapper.ms3-wrapper--dark {
	--ms3-primary-color: #f5f5f5;
	--ms3-background-color: #111;
	--ms3-border-color: #333;
}
```

You can also keep auto-emit on `.ms3-wrapper` and only add modifier overrides — no need for `null`
unless you want a selector that is not `$ms3-tokens-selector`.

### Themed chrome icons (`$ms3-future-v8-themedIcons`)

By default the UI chrome icons (`mapsight-ui/*.svg`: map controls, list filter buttons, layer switcher checkboxes,
search, close buttons, feature links, place actions, loading/error status) are CSS background images, so they keep the
colours baked into the SVG files (theme blue `#0e78ad`, red `#cc100c`) whatever the `--ms3-*` tokens say. Opt in to
paint them in the theme colours instead:

```scss
@use "@mapsight/ui/src/scss/variables" with (
	$ms3-iconPath: "~@mapsight/ui/dist/img/",
	$ms3-future-v8-themedIcons: true
);
@use "@mapsight/ui/src/scss/default";
```

The SVG then only provides the shape (CSS `mask-image`); the colour comes from these properties, resolved on each
icon so that overrides on `.ms3-wrapper` or any ancestor apply:

| Icons                                                  | Colour                                                   |
| ------------------------------------------------------ | -------------------------------------------------------- |
| Controls and statuses (was blue)                       | `var(--ms3-icon-color, var(--ms3-theme-color-a))`        |
| Hover and active states: sort, filter, reset (was red) | `var(--ms3-icon-color-active, var(--ms3-theme-color-b))` |
| Error status (was red)                                 | `var(--ms3-icon-color-error, var(--ms3-theme-color-b))`  |
| Inactive or unavailable geolocation (was grey)         | `var(--ms3-icon-color-muted, #a8a8a8)`                   |

```css
.ms3-wrapper {
	--ms3-theme-color-a: #1e5631; /* recolours buttons, links and icons */
	--ms3-icon-color-muted: #6b6b6b; /* optional: icons only */
}
```

`--ms3-icon-color*` are optional overrides and are not emitted by `tokens`. In the default theme the result matches the
background icons except for two colour corrections: the red icons use `--ms3-theme-color-b` (`#cc0000` instead of
`#cc100c`), and the feature-details print icon uses the theme blue (`#0e78ad` instead of `#207ab6`). The Mapsight
watermark (`.ms3-logo`) stays as it is.

**Compatibility.** Without the flag, the compiled CSS is unchanged. With the flag:

- Icon files from your own `$ms3-iconPath` still work, but only their shape is used. Multi-colour icons become
  single-colour. Keep the flag off if you rely on coloured icon files.
- Icons must load from the page's origin, as `data:` URIs (Vite inlines small assets by default), or with an
  `Access-Control-Allow-Origin` header: browsers fetch mask images in CORS mode and drop a cross-origin icon without it.
- Host CSS that replaces an icon with `background-image` must set `mask-image` (and `-webkit-mask-image`) instead.
  Map control and status icons stay on `::before`, place-action icons on their `__icon` span. Controls with their own border, hover background or focus ring (list filter
  buttons, feature links, dialog close, search buttons) now draw the icon on a `::before` box covering the control
  (`::after` for the layer switcher checkbox and the search reset icon), so `background-image` on the control itself
  no longer shows the icon.
- A mask makes its box stack like a positioned element. Host panels that should cover Mapsight controls need
  `position` and `z-index: 1` or more; the layer switcher and tool overlays already set this.
- In forced-colors (high contrast) mode the icons use system colours (`ButtonText`, `CanvasText`, `LinkText`,
  `GrayText`; `Highlight` for active states) instead of the theme colours. Browsers print icons like other
  backgrounds: only when the user enables background graphics.

In v8 this becomes the only behaviour and the flag is removed (see
[Decision 012](https://github.com/open-mapsight/mapsight/blob/main/docs/architecture/decisions/012-future-flags-for-next-major-ui.md)).

Scroll utilities (also from `default`): `.ms3-minimal-scrollbar`, `.ms3-scroll-container`, plus mixins under
`src/scss/mixins/minimal-scrollbar`.

Copy `@mapsight/traffic-style` icons (`mapsight-icons*`) to `public/img/` separately — they are fetched at runtime via
`imagesUrl`, not via this SCSS path.

When contributing UI SCSS, keep base partials such as `src/scss/blocks/*` minimal and structural. Opinionated visual
treatment — fixed dimensions, dense spacing, expanded panel widths, grid breakpoints, and host-specific sizing — belongs
in an explicit theme under `src/scss/themes/` or in the host app's own stylesheet.

Copy-out templates: [
`starters/mapsight-host-starter`](https://github.com/open-mapsight/mapsight/tree/main/starters/mapsight-host-starter), [
`starters/mapsight-next-starter`](https://github.com/open-mapsight/mapsight/tree/main/starters/mapsight-next-starter), [
`starters/mapsight-vite-spa-starter`](https://github.com/open-mapsight/mapsight/tree/main/starters/mapsight-vite-spa-starter).

## Documentation

| Guide                                                                                                                          | Package                   | Description                                           |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------- | ----------------------------------------------------- |
| [Documentation hub](https://github.com/open-mapsight/mapsight/blob/main/docs/README.md)                                        | —                         | Architecture, ecosystem, integration overview         |
| [Mapsight Redux Architecture](https://github.com/open-mapsight/mapsight/blob/main/packages/core/docs/REDUX_ARCHITECTURE.md)    | `@mapsight/core`          | GIS state layer — store, controllers, OpenLayers sync |
| [Mapsight Action API — Decision Guide](https://github.com/open-mapsight/mapsight/blob/main/packages/core/docs/ACTION_GUIDE.md) | `@mapsight/core`          | Which action API to dispatch for a given task         |
| [SSR and hydration](https://github.com/open-mapsight/mapsight/blob/main/docs/integration/SSR_HYDRATION.md)                     | —                         | CMS embed + `data-dehydrated-state` contract          |
| [CMS PHP integration](https://github.com/open-mapsight/mapsight/blob/main/docs/integration/CMS_PHP.md)                         | —                         | Classic PHP host pattern                              |
| [React SPA](https://github.com/open-mapsight/mapsight/blob/main/docs/integration/REACT_SPA.md)                                 | —                         | Standalone React apps                                 |
| [Next.js](https://github.com/open-mapsight/mapsight/blob/main/docs/integration/NEXTJS.md)                                      | —                         | Next.js host notes                                    |
| [Default icons and vector styles](https://github.com/open-mapsight/mapsight/blob/main/packages/traffic-style/README.md)        | `@mapsight/traffic-style` | Precompiled style function and icon catalog           |

## Related packages

| Package                                                                                                                           | Role                                                |
| --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| [`@mapsight/core`](https://github.com/open-mapsight/mapsight/blob/main/packages/core/README.md)                                   | Redux GIS runtime (usable without React)            |
| [`@mapsight/traffic-style`](https://github.com/open-mapsight/mapsight/blob/main/packages/traffic-style/README.md)                 | Default style function and icons                    |
| [`@mapsight/vector-style-compiler`](https://github.com/open-mapsight/mapsight/blob/main/packages/vector-style-compiler/README.md) | CSS subset → compiled style function                |
| [`@mapsight/lib-ol`](https://github.com/open-mapsight/mapsight/blob/main/packages/lib-ol/README.md)                               | OpenLayers helpers (style cache, map fit, features) |
| [`@mapsight/lib-redux`](https://github.com/open-mapsight/mapsight/blob/main/packages/lib-redux/README.md)                         | Redux helpers used by core and UI plugins           |
