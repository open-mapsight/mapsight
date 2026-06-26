# Mapsight

<img width="2000" height="643" alt="Mapsight - Open Source - Accessible - Privacy First" src="https://github.com/user-attachments/assets/955a0c5c-113a-4d61-baa6-f89adc807eb1" />

[![CI](https://github.com/open-mapsight/mapsight/actions/workflows/ci.yml/badge.svg)](https://github.com/open-mapsight/mapsight/actions/workflows/ci.yml)

Mapsight is a framework for building web applications with OpenLayers and React.

## Package overview

<table>
<colgroup>
<col width="290">
</colgroup>
<thead>
<tr>
<th align="left">Package</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td><nobr>⛓️ <strong><code>core</code></strong></nobr><br><nobr><a href="https://www.npmjs.com/package/@mapsight/core"><img alt="NPM Version" src="https://img.shields.io/npm/v/%40mapsight%2Fcore?style=flat"></a> | <a href="packages/core/README.md">README</a></nobr></td>
<td><strong>Mapsight Core (Redux Store)</strong><br>The core of Mapsight, providing the Redux store and the core architecture (controllers, base actions, redux devtools).</td>
</tr>
<tr>
<td><nobr>🖥️ <strong><code>ui</code></strong></nobr><br><nobr><a href="https://www.npmjs.com/package/@mapsight/ui"><img alt="NPM Version" src="https://img.shields.io/npm/v/%40mapsight%2Fui?style=flat"></a> | <a href="packages/ui/README.md">README</a></nobr></td>
<td><strong>Default UI (React)</strong><br>The default UI and component library with maps, lists, filters, switchers, etc. Mapsight UI allows you to compose your own UI from the provided components or use a default UI with some configuration and customizations.</td>
</tr>
<tr>
<td><nobr>🎨 <strong><code>traffic-style</code></strong></nobr><br><nobr><a href="https://www.npmjs.com/package/@mapsight/traffic-style"><img alt="NPM Version" src="https://img.shields.io/npm/v/%40mapsight%2Ftraffic-style?style=flat"></a> | <a href="packages/traffic-style/README.md">README</a></nobr></td>
<td><strong>Default style package (icons and vector styles)</strong><br>The default style package with icons and vector styles, tailored for traffic applications, but also provides a set of general POI styles and icons, suitable for various use cases.</td>
</tr>
<tr>
<td><nobr>✏️ <strong><code>vector-style-compiler</code></strong></nobr><br><nobr><a href="https://www.npmjs.com/package/@mapsight/vector-style-compiler"><img alt="NPM Version" src="https://img.shields.io/npm/v/%40mapsight%2Fvector-style-compiler?style=flat"></a> | <a href="packages/vector-style-compiler/README.md">README</a></nobr></td>
<td><strong>CSS → OL StyleFunction compiler</strong><br>The vector style compiler is a tool that converts a subset of CSS styles into a multi-layer cached efficient OpenLayers style function, letting you style based on zoom, feature properties, environment, and more. It also allows you to freely add more geometries based on the base features to build complex vector objects.</td>
</tr>
<tr>
<td><nobr>📦 <strong><code>vite-host-embed</code></strong></nobr><br><nobr><a href="https://www.npmjs.com/package/@mapsight/vite-host-embed"><img alt="NPM Version" src="https://img.shields.io/npm/v/%40mapsight%2Fvite-host-embed?style=flat"></a> | <a href="packages/vite-host-embed/README.md">README</a></nobr></td>
<td><strong>Host embed Vite plugin</strong><br>Lib-mode post-build finalize, HTML snippet markers (<code>snippetSources</code>), dev deploy-path aliases, snippet preview.</td>
</tr>
<tr>
<td><nobr>📦 <strong><code>vite-count-aggregator-embed</code></strong></nobr><br><nobr><a href="https://www.npmjs.com/package/@mapsight/vite-count-aggregator-embed"><img alt="NPM Version" src="https://img.shields.io/npm/v/%40mapsight%2Fvite-count-aggregator-embed?style=flat"></a> | <a href="packages/vite-count-aggregator-embed/README.md">README</a></nobr></td>
<td><strong>Count-aggregator CMS Vite plugin</strong><br>App-shell post-build finalize — assets-only deploy tree + paste-ready snippet for <code>@mapsight/count-aggregator-ui</code>.</td>
</tr>
<tr>
<td><nobr>🌐 <strong><code>lib-ol</code></strong></nobr><br><nobr><a href="https://www.npmjs.com/package/@mapsight/lib-ol"><img alt="NPM Version" src="https://img.shields.io/npm/v/%40mapsight%2Flib-ol?style=flat"></a> | <a href="packages/lib-ol/README.md">README</a></nobr></td>
<td><strong>OpenLayers utilities</strong><br>This package contains utilities for working with OpenLayers.</td>
</tr>
<tr>
<td><nobr>⚛️ <strong><code>lib-redux</code></strong></nobr><br><nobr><a href="https://www.npmjs.com/package/@mapsight/lib-redux"><img alt="NPM Version" src="https://img.shields.io/npm/v/%40mapsight%2Flib-redux?style=flat"></a> | <a href="packages/lib-redux/README.md">README</a></nobr></td>
<td><strong>Redux utilities</strong><br>This package contains utilities for working with Redux.</td>
</tr>
<tr>
<td><nobr>⚙️ <strong><code>lib-js</code></strong></nobr><br><nobr><a href="https://www.npmjs.com/package/@mapsight/lib-js"><img alt="NPM Version" src="https://img.shields.io/npm/v/%40mapsight%2Flib-js?style=flat"></a> | <a href="packages/lib-js/README.md">README</a></nobr></td>
<td><strong>JavaScript utilities (Deprecated)</strong><br>This package contains utilities for working with JavaScript.<br>⚠️ <strong>Warning:</strong> Do not depend on this package. It is deprecated and will be removed in the future.</td>
</tr>
<tr>
<td><nobr>📊 <strong><code>count-aggregator-api</code></strong></nobr><br><nobr><a href="https://www.npmjs.com/package/@mapsight/count-aggregator-api"><img alt="NPM Version" src="https://img.shields.io/npm/v/%40mapsight%2Fcount-aggregator-api?style=flat"></a> | <a href="packages/count-aggregator-api/README.md">README</a></nobr></td>
<td><strong>Count aggregator API client</strong><br>OpenAPI contract, Zod schemas, and typed HTTP client for Mapsight count-aggregator station metadata and aggregated count data.</td>
</tr>
<tr>
<td><nobr>📈 <strong><code>count-aggregator-ui</code></strong></nobr><br><nobr><a href="https://www.npmjs.com/package/@mapsight/count-aggregator-ui"><img alt="NPM Version" src="https://img.shields.io/npm/v/%40mapsight%2Fcount-aggregator-ui?style=flat"></a> | <a href="packages/count-aggregator-ui/README.md">README</a></nobr></td>
<td><strong>Count aggregator UI (React)</strong><br>Embeddable wizard, time-series charts, and export links. CMS app-shell embed via <a href="packages/vite-count-aggregator-embed/README.md"><code>vite-count-aggregator-embed</code></a>.</td>
</tr>
</tbody>
</table>

## Applications

<table>
<colgroup>
<col width="290">
</colgroup>
<thead>
<tr>
<th align="left">Application</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td><nobr>🧑‍🎨 <strong><code>vector-editor</code></strong></nobr><br><nobr><a href="apps/vector-editor">App</a></nobr></td>
<td>Vector editor for creating and editing vector features exported as GeoJSON.</td>
</tr>
<tr>
<td><nobr>💡 <strong><code>showcase</code></strong></nobr><br><nobr><a href="apps/showcase">App</a></nobr></td>
<td>Mapsight ecosystem showcase — UI demo, icon catalog, and runtime icons.</td>
</tr>
</tbody>
</table>

## Starters

Copy-out host integration templates under [`starters/`](starters/) — semver `@mapsight/*` pins only; not published as a
monorepo unit. See [`starters/README.md`](starters/README.md).

<table>
<colgroup>
<col width="290">
</colgroup>
<thead>
<tr>
<th align="left">Starter</th>
<th align="left">Status</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td><nobr><strong><code>mapsight-host-starter</code></strong></nobr><br><nobr><a href="starters/mapsight-host-starter/README.md">README</a></nobr></td>
<td><strong>Beta</strong></td>
<td>Host embed build (<code>browserEmbed</code> + paste-ready snippet).</td>
</tr>
<tr>
<td><nobr><strong><code>mapsight-next-starter</code></strong></nobr><br><nobr><a href="starters/mapsight-next-starter/README.md">README</a></nobr></td>
<td><strong>WIP</strong></td>
<td>Next.js App Router copy-out template.</td>
</tr>
<tr>
<td><nobr><strong><code>mapsight-vite-spa-starter</code></strong></nobr><br><nobr><a href="starters/mapsight-vite-spa-starter/README.md">README</a></nobr></td>
<td><strong>WIP</strong></td>
<td>Minimal Vite + React Router SPA copy-out template.</td>
</tr>
</tbody>
</table>

## Documentation

See **[`docs/README.md`](docs/README.md)** — role-based paths, architecture, integration guides, and getting started.

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

## Community

Participation in Mapsight community spaces is governed by our
[Code of Conduct](CODE_OF_CONDUCT.md) (Contributor Covenant 3.0).

## Security

To report a security vulnerability, see the
[Open Mapsight security policy](https://github.com/open-mapsight/.github/blob/main/SECURITY.md)
or email [security@open-mapsight.org](mailto:security@open-mapsight.org).
