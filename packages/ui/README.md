# @mapsight/ui

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

| Import                       | Role                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `@mapsight/ui`               | `create()`, React components, plugins, hooks                                 |
| `@mapsight/ui/config`        | Config builders (`map`, `features`, `featureList`, Zod schemas)              |
| `@mapsight/ui/embed/browser` | CMS embed bootstrap (`browserEmbed`, hydration from `data-dehydrated-state`) |
| `@mapsight/ui/embed/node`    | Server-side render entry for dehydrated HTML shells                          |

Peer dependency: `react`, `react-dom`.

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

| Guide                                                                                                                                     | Package                   | Description                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------- |
| [Documentation hub](https://github.com/open-mapsight/mapsight/blob/main/docs/README.md)                                                   | —                         | Architecture, ecosystem, integration overview         |
| [Mapsight Redux Architecture](https://github.com/open-mapsight/mapsight/blob/main/packages/core/docs/REDUX_ARCHITECTURE.md)               | `@mapsight/core`          | GIS state layer — store, controllers, OpenLayers sync |
| [Mapsight Action API — Decision Guide](https://github.com/open-mapsight/mapsight/blob/main/packages/core/docs/ACTION_GUIDE.md)            | `@mapsight/core`          | Which action API to dispatch for a given task         |
| [SSR and hydration](https://github.com/open-mapsight/mapsight/blob/main/docs/integration/SSR_HYDRATION.md)                                | —                         | CMS embed + `data-dehydrated-state` contract          |
| [CMS PHP integration](https://github.com/open-mapsight/mapsight/blob/main/docs/integration/CMS_PHP.md)                                    | —                         | Classic PHP host pattern                              |
| [React SPA](https://github.com/open-mapsight/mapsight/blob/main/docs/integration/REACT_SPA.md)                                            | —                         | Standalone React apps                                 |
| [Next.js](https://github.com/open-mapsight/mapsight/blob/main/docs/integration/NEXTJS.md)                                                 | —                         | Next.js host notes                                    |
| [Default icons and vector styles](https://github.com/open-mapsight/mapsight/blob/main/packages/traffic-style/README.md)                   | `@mapsight/traffic-style` | Precompiled style function and icon catalog           |
| [Feature list sorter — deferred UX ideas](https://github.com/open-mapsight/mapsight/blob/main/packages/ui/docs/FEATURE_LIST_SORTER_UX.md) | `@mapsight/ui`            | Low-priority UX notes (not on the roadmap)            |

## Related packages

| Package                                                                                                                           | Role                                                |
| --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| [`@mapsight/core`](https://github.com/open-mapsight/mapsight/blob/main/packages/core/README.md)                                   | Redux GIS runtime (usable without React)            |
| [`@mapsight/traffic-style`](https://github.com/open-mapsight/mapsight/blob/main/packages/traffic-style/README.md)                 | Default style function and icons                    |
| [`@mapsight/vector-style-compiler`](https://github.com/open-mapsight/mapsight/blob/main/packages/vector-style-compiler/README.md) | CSS subset → compiled style function                |
| [`@mapsight/lib-ol`](https://github.com/open-mapsight/mapsight/blob/main/packages/lib-ol/README.md)                               | OpenLayers helpers (style cache, map fit, features) |
| [`@mapsight/lib-redux`](https://github.com/open-mapsight/mapsight/blob/main/packages/lib-redux/README.md)                         | Redux helpers used by core and UI plugins           |
