# @mapsight/vite-host-embed

Vite plugin for **Mapsight host embed** production builds: copies static assets, stabilizes the app stylesheet, rewrites
CSS `url()` paths, writes paste-ready HTML snippets, and optionally generates Apache `.htaccess` rules.

Reference implementation: [
`starters/mapsight-host-starter`](https://github.com/open-mapsight/mapsight/tree/main/starters/mapsight-host-starter).

## Install

```bash
npm install @mapsight/vite-host-embed vite
```

## Usage

```ts
import path from "node:path";
import {fileURLToPath} from "node:url";

import {mapsightHostEmbedPlugin} from "@mapsight/vite-host-embed";
import {defineConfig} from "vite";

const appRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [
		mapsightHostEmbedPlugin(appRoot, {
			assetsBase: "/mapsight-assets",
			runtimeEntry: "embed",
			appStylesheet: "mapsight.css",
			embedTypeEntries: {
				simpleMap: "entries/simpleMap.ts",
			},
			appStylesheetPrefix: "mapsight-host",
			appStylesheetEntry: "entries/mapsight.entry.css",
			snippetSources: [{name: "simple", file: "index.html"}],
		}),
	],
});
```

Run the plugin in **embed build mode** alongside a Vite lib build that emits embed entry chunks into
`dist/mapsight-assets/assets/`. See
the [host starter](https://github.com/open-mapsight/mapsight/tree/main/starters/mapsight-host-starter) for a full
`vite.config` example.

For local dev, use `mapsightHostEmbedDevPlugin` so `index.html` can use the same `/mapsight-assets/assets/…` import
paths as generated snippets (aliased to `entries/*.ts` with HMR).

### Snippet preview

Browse paste-ready snippets during `vite preview`:

```ts
import {mapsightSnippetPreviewPlugin} from "@mapsight/vite-host-embed";

mapsightSnippetPreviewPlugin(appRoot, {
	snippetsDir: "dist/snippets",
	urlPrefix: "/cms-snippets/",
});
```

### Snippet HTML entry

For full-page app shells, build only the marked region:

```ts
import {mapsightSnippetHtmlEntryPlugin} from "@mapsight/vite-host-embed";

mapsightSnippetHtmlEntryPlugin(appRoot, {
	entryFile: "count-aggregator/index.html",
});
```

## Snippet markers

Mark paste-ready regions in HTML source files:

```html
<!-- mapsight:snippet:start -->
<link rel="stylesheet" href="/mapsight-assets/assets/mapsight.css" />
…
<!-- mapsight:snippet:end -->
```

Configure `snippetSources` to extract these regions into `dist/snippets/*.html` at build time. Optional inline hints for
CMS editors (kept in built snippets; stripped in dev so Vite can parse inline scripts):

```html
imagesUrl: "/mapsight-assets/img/",
<!-- mapsight:cms:replace imagesUrl … -->
```

## Configuration

| Option                | Default                | Purpose                                                                                 |
| --------------------- | ---------------------- | --------------------------------------------------------------------------------------- |
| `assetsBase`          | —                      | Deploy URL prefix (`/mapsight-assets`)                                                  |
| `runtimeEntry`        | —                      | Shared `browserEmbed` entry basename                                                    |
| `appStylesheet`       | —                      | Stable CSS filename after post-build rename                                             |
| `embedTypeEntries`    | —                      | Preset entry names (used in cache headers)                                              |
| `outDir`              | `dist/mapsight-assets` | Deploy tree relative to app root                                                        |
| `snippetsDir`         | `dist/snippets`        | Paste-ready HTML + README (not uploaded)                                                |
| `appStylesheetPrefix` | —                      | Prefer hashed CSS matching this prefix                                                  |
| `imgDir`              | `public/img`           | Source traffic-style icons copied to deploy `img/` (runtime `imagesUrl`; not UI chrome) |
| `dataDir`             | `public/data`          | Source data copied to deploy `data/` when present                                       |
| `snippetSources`      | —                      | HTML files with `<!-- mapsight:snippet:start/end -->` to extract at build               |
| `writeHtaccess`       | `true`                 | Emit Apache rewrite + cache rules                                                       |

## Monorepo development

```bash
pnpm --filter @mapsight/vite-host-embed clean-build test typecheck
```

## Related

- [CMS_PHP integration guide](https://github.com/open-mapsight/mapsight/blob/main/docs/integration/CMS_PHP.md)
- [Host starter](https://github.com/open-mapsight/mapsight/tree/main/starters/mapsight-host-starter)
- [CONFIG_REFERENCE](https://github.com/open-mapsight/mapsight/blob/main/docs/integration/CONFIG_REFERENCE.md)
