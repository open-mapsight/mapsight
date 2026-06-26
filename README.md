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
| <nobr>📦 [**`vite-host-embed`**](packages/vite-host-embed/README.md)</nobr>                                                                                                            | **Host embed Vite plugin**<br>Lib-mode post-build finalize, HTML snippet markers (`snippetSources`), dev deploy-path aliases, snippet preview.                                                                                                                                                                                                                          |
| <nobr>📦 [**`vite-count-aggregator-embed`**](packages/vite-count-aggregator-embed/README.md)</nobr>                                                                                    | **Count-aggregator CMS Vite plugin**<br>App-shell post-build finalize — assets-only deploy tree + paste-ready snippet for `@mapsight/count-aggregator-ui`.                                                                                                                                                                                                              |
| <nobr>🌐 [**`lib-ol`**](packages/lib-ol/README.md)</nobr><br>![NPM Version](https://img.shields.io/npm/v/%40mapsight%2Flib-ol?style=flat)                                              | **OpenLayers utilities**<br>This package contains utilities for working with OpenLayers.                                                                                                                                                                                                                                                                                |
| <nobr>⚛️ [**`lib-redux`**](packages/lib-redux/README.md)</nobr><br>![NPM Version](https://img.shields.io/npm/v/%40mapsight%2Flib-redux?style=flat)                                     | **Redux utilities**<br>This package contains utilities for working with Redux.                                                                                                                                                                                                                                                                                          |
| <nobr>⚙️ [**`lib-js`**](packages/lib-js/README.md)</nobr><br>![NPM Version](https://img.shields.io/npm/v/%40mapsight%2Flib-js?style=flat)                                              | **JavaScript utilities (Deprecated)**<br>This package contains utilities for working with JavaScript.<br>⚠️ **Warning:** Do not depend on this package. It is deprecated and will be removed in the future.                                                                                                                                                             |
| <nobr>📊 [**`count-aggregator-api`**](packages/count-aggregator-api/README.md)</nobr><br>![NPM Version](https://img.shields.io/npm/v/%40mapsight%2Fcount-aggregator-api?style=flat)    | **Count aggregator API client**<br>OpenAPI contract, Zod schemas, and typed HTTP client for Mapsight count-aggregator station metadata and aggregated count data.                                                                                                                                                                                                       |
| <nobr>📈 [**`count-aggregator-ui`**](packages/count-aggregator-ui/README.md)</nobr><br>![NPM Version](https://img.shields.io/npm/v/%40mapsight%2Fcount-aggregator-ui?style=flat)       | **Count aggregator UI (React)**<br>Embeddable wizard, time-series charts, and export links. CMS app-shell embed via [`vite-count-aggregator-embed`](packages/vite-count-aggregator-embed/README.md).                                                                                                                                                                    |

## Applications

| Application                                               | Description                                                                 |
| :-------------------------------------------------------- | :-------------------------------------------------------------------------- |
| <nobr>🧑‍🎨 [**`vector-editor`**](apps/vector-editor)</nobr> | Vector editor for creating and editing vector features exported as GeoJSON. |
| <nobr>💡 [**`showcase`**](apps/showcase)</nobr>           | Mapsight ecosystem showcase — UI demo, icon catalog, and runtime icons.     |

## Starters

Copy-out host integration templates under [`starters/`](starters/) — semver `@mapsight/*` pins only; not published as a
monorepo unit. See [`starters/README.md`](starters/README.md).

| Starter                                                               | Status   | Description                                              |
| :-------------------------------------------------------------------- | :------- | :------------------------------------------------------- |
| [**`mapsight-host-starter`**](starters/mapsight-host-starter)         | **Beta** | Host embed build (`browserEmbed` + paste-ready snippet). |
| **`mapsight-next-starter`**                                           | **WIP**  | Next.js App Router copy-out template.                    |
| [**`mapsight-vite-spa-starter`**](starters/mapsight-vite-spa-starter) | **WIP**  | Minimal Vite + React Router SPA copy-out template.       |

## Documentation

Start at **[`docs/README.md`](docs/README.md)** for role-based paths, architecture, integration guides,
and [getting started](docs/getting-started.md). The [private workspace](#private-workspace-paths) section applies only
to maintainers with a private checkout.

| Topic                  | Document                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------- |
| Hub                    | [`docs/README.md`](docs/README.md)                                                     |
| Getting started        | [`docs/getting-started.md`](docs/getting-started.md)                                   |
| Host embed starter     | [`starters/mapsight-host-starter`](starters/mapsight-host-starter)                     |
| Ecosystem & deployment | [`docs/architecture/ECOSYSTEM.md`](docs/architecture/ECOSYSTEM.md)                     |
| Principles & scope     | [`docs/architecture/PRINCIPLES.md`](docs/architecture/PRINCIPLES.md)                   |
| Decisions              | [`docs/architecture/decisions/README.md`](docs/architecture/decisions/README.md)       |
| Current vs target      | [`docs/architecture/CURRENT_VS_TARGET.md`](docs/architecture/CURRENT_VS_TARGET.md)     |
| Redux runtime          | [`packages/core/docs/REDUX_ARCHITECTURE.md`](packages/core/docs/REDUX_ARCHITECTURE.md) |
| Redux actions          | [`packages/core/docs/ACTION_GUIDE.md`](packages/core/docs/ACTION_GUIDE.md)             |
| Licensing              | [`docs/LICENSING.md`](docs/LICENSING.md), [`docs/TRADEMARK.md`](docs/TRADEMARK.md)     |

## Private workspace paths

Mapsight is open source, but some development still happens outside this tree. The monorepo reserves workspace paths for
that (`private/apps/*`, `private/packages/*` in [`pnpm-workspace.yaml`](pnpm-workspace.yaml)) without publishing
anything under `private/` here.

To prevent accidental leaks, this repository enforces checks locally and in CI:

- Git hooks: [`.husky/pre-commit`](.husky/pre-commit), [`.husky/pre-push`](.husky/pre-push)
- Script: [`scripts/check-no-private-leak.mts`](scripts/check-no-private-leak.mts) — `pnpm run check:no-private-leak`,
  `pnpm run typecheck:scripts`
- CI: `no-private-leak` job in [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

**Please do not open pull requests that remove or weaken these guards.**

## Development

```bash
# Install with pnpm
pnpm install

# Run all tests & checks
pnpm test
pnpm lint
pnpm typecheck
pnpm format:check

# Watch mode
pnpm watch

# Build everything
pnpm build

# Build single package
pnpm --filter @mapsight/vector-style-compiler build
```

## License

The public framework is **[MIT](LICENSE)**. See [`docs/LICENSING.md`](docs/LICENSING.md) and
[`docs/TRADEMARK.md`](docs/TRADEMARK.md) for code and brand terms.

For licensing or trademark questions, contact
[contact@open-mapsight.org](mailto:contact@open-mapsight.org). For code, docs, and integration questions, use
[GitHub issues](https://github.com/open-mapsight/mapsight/issues).

## Security

To report a security vulnerability, see the
[Open Mapsight security policy](https://github.com/open-mapsight/.github/blob/main/SECURITY.md)
or email [security@open-mapsight.org](mailto:security@open-mapsight.org).
