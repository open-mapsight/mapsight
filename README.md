# Mapsight

<img width="2000" height="643" alt="Mapsight - Open Source - Accessible - Privacy First" src="https://github.com/user-attachments/assets/955a0c5c-113a-4d61-baa6-f89adc807eb1" />

[![CI](https://github.com/open-mapsight/mapsight/actions/workflows/ci.yml/badge.svg)](https://github.com/open-mapsight/mapsight/actions/workflows/ci.yml)

Mapsight is a framework for building web applications with OpenLayers and React.

## Package overview

| Package                                                                                                                                                                                | Description                                                                                                                                                                                                                                                                                                                                                             |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <nobr>⛓️ [**`core`**](packages/core/README.md)</nobr><br>![NPM Version](https://img.shields.io/npm/v/%40mapsight%2Fcore?style=flat)                                                    | **Mapsight Core (Redux Store)**<br>The core of Mapsight, providing the Redux store and the core architecture (controllers, base actions, redux devtools).                                                                                                                                                                                                               |
| <nobr>🖥️ [**`ui`**](packages/ui/README.md)</nobr><br>![NPM Version](https://img.shields.io/npm/v/%40mapsight%2Fui?style=flat)                                                          | **Default UI (React)**<br>The default UI and component library with maps, lists, filters, switchers, etc. Mapsight UI allows you to compose your own UI from the provided components or use a default UI with some configuration and customizations.                                                                                                                    |
| <nobr>🎨 [**`traffic-style`**](packages/traffic-style/README.md)</nobr><br>![NPM Version](https://img.shields.io/npm/v/%40mapsight%2Ftraffic-style?style=flat)                         | **Default style package (icons and vector styles)**<br>The default style package with icons and vector styles, tailored for traffic applications, but also provides a set of general POI styles and icons, suitable for various use cases.                                                                                                                              |
| <nobr>✏️ [**`vector-style-compiler`**](packages/vector-style-compiler/README.md)</nobr><br>![NPM Version](https://img.shields.io/npm/v/%40mapsight%2Fvector-style-compiler?style=flat) | **CSS → OL StyleFunction compiler**<br>The vector style compiler is a tool that converts a subset of CSS styles into a multi-layer cached efficient OpenLayers style function, letting you style based on zoom, feature properties, environment, and more. It also allows you to freely add more geometries based on the base features to build complex vector objects. |
| <nobr>🌐 [**`lib-ol`**](packages/lib-ol/README.md)</nobr><br>![NPM Version](https://img.shields.io/npm/v/%40mapsight%2Flib-ol?style=flat)                                              | **OpenLayers utilities**<br>This package contains utilities for working with OpenLayers.                                                                                                                                                                                                                                                                                |
| <nobr>⚛️ [**`lib-redux`**](packages/lib-redux/README.md)</nobr><br>![NPM Version](https://img.shields.io/npm/v/%40mapsight%2Flib-redux?style=flat)                                     | **Redux utilities**<br>This package contains utilities for working with Redux.                                                                                                                                                                                                                                                                                          |
| <nobr>⚙️ [**`lib-js`**](packages/lib-js/README.md)</nobr><br>![NPM Version](https://img.shields.io/npm/v/%40mapsight%2Flib-js?style=flat)                                              | **JavaScript utilities (Deprecated)**<br>This package contains utilities for working with JavaScript.<br>⚠️ **Warning:** Do not depend on this package. It is deprecated and will be removed in the future.                                                                                                                                                             |

## Applications

| Application                                               | Description                                                                 |
| :-------------------------------------------------------- | :-------------------------------------------------------------------------- |
| <nobr>🧑‍🎨 [**`vector-editor`**](apps/vector-editor)</nobr> | Vector editor for creating and editing vector features exported as GeoJSON. |
| <nobr>💡 [**`showcase`**](apps/showcase)</nobr>           | Mapsight ecosystem showcase — UI demo, icon catalog, and runtime icons.     |
| <nobr>💡 [**`demo-next`**](apps/demo-next)</nobr>         | Simple demo app of Mapsight UI built with Next.js.                          |

## Development

```bash
# Install with pnpm
pnpm install

# Run all tests & checks
pnpm test
pnpm lint
pnpm typecheck
pnpm check
pnpm format:check

# Watch mode
pnpm watch

# Build everything
pnpm build

# Build single package
pnpm --filter @mapsight/vector-style-compiler build
```
