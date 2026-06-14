# @mapsight/vite-count-aggregator-embed

Vite plugin for **count-aggregator app-shell** CMS embed production builds: rewrites asset paths, extracts a paste-ready HTML snippet from the built page, and writes an assets-only deploy tree with Apache `.htaccess`.

Use with [`@mapsight/count-aggregator-ui`](https://github.com/open-mapsight/mapsight/blob/main/packages/count-aggregator-ui/README.md) and [`mapsightSnippetHtmlEntryPlugin`](https://github.com/open-mapsight/mapsight/tree/main/packages/vite-host-embed) from `@mapsight/vite-host-embed`.

## Install

```bash
npm install @mapsight/vite-count-aggregator-embed @mapsight/vite-host-embed vite
```

## Usage

Mark the paste-ready region in your app HTML entry:

```html
<!-- mapsight:snippet:start -->
<div id="count-aggregator-root"></div>
<script type="module" src="/src/main.tsx"></script>
<!-- mapsight:snippet:end -->
```

Wire Vite plugins:

```ts
import {finalizeCountAggregatorAppShellPlugin} from "@mapsight/vite-count-aggregator-embed";
import {mapsightSnippetHtmlEntryPlugin} from "@mapsight/vite-host-embed";

export default defineConfig({
	plugins: [
		mapsightSnippetHtmlEntryPlugin(appRoot, {
			entryFile: "count-aggregator/index.html",
		}),
		finalizeCountAggregatorAppShellPlugin(appRoot, {
			outDir: "dist/count-aggregator",
			snippetsDir: "dist/snippets",
			snippetName: "count-aggregator",
			builtHtmlRelativePath: "count-aggregator/index.html",
			removeFromDeployRelativePath: "count-aggregator",
			assetsRewriteBase: "/mapsight-assets",
			htaccessBase: "/count-aggregator",
			cacheConfig: {
				runtimeEntry: "embed",
				appStylesheet: "mapsight.css",
				embedTypeEntries: {},
			},
		}),
	],
});
```

After `vite build`, deploy only `dist/count-aggregator/assets/` and `.htaccess`. Paste `dist/snippets/count-aggregator.html` into the host CMS page.

## Related docs

- [`@mapsight/count-aggregator-ui` README](https://github.com/open-mapsight/mapsight/blob/main/packages/count-aggregator-ui/README.md)
- [`@mapsight/vite-host-embed` README](https://github.com/open-mapsight/mapsight/tree/main/packages/vite-host-embed)
