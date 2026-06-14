# Mapsight host embed starter

**Beta** — minimal **copy-out template** for building Mapsight embed assets with Vite lib mode and `browserEmbed`.

The same build pattern applies whether the host is a **PHP CMS**, a **static site**, or a **Vue/React SPA shell** that loads stable script URLs — CMS is just the most common paste-a-snippet case.

Copy this directory into your host repository.

Integration guide: [CMS_PHP.md](https://github.com/open-mapsight/mapsight/blob/main/docs/integration/CMS_PHP.md).

**Deploy prefix in this template:** `/mapsight-assets/` — change `HOST_ASSETS_BASE` in [`vite.config.mts`](vite.config.mts).

---

## Prerequisites

- Node 24+
- npm, pnpm, or yarn

---

## Local development

```bash
npm install
npm run dev
```

Opens `index.html` with HMR — **same import paths and config as the production snippet** (`/mapsight-assets/assets/…`, aliased to `entries/*.ts` in dev).

---

## Production build

```bash
npm run build
```

Output:

```
dist/
├── mapsight-assets/          ← upload this tree to the web root
│   ├── assets/
│   │   ├── embed.js          ← re-exports @mapsight/ui/embed/browser (default)
│   │   ├── simpleMap.js      ← preset factory stub
│   │   ├── mapsight.css      ← stable stylesheet (+ bundled UI icon assets)
│   │   └── *-[hash].js       ← shared chunks (long cache)
│   ├── data/demo.geojson
│   ├── img/                  ← traffic-style runtime icons (mapsight-icons*)
│   └── .htaccess             ← Apache cache + static passthrough
└── snippets/                 ← paste-ready reference (do not upload)
    ├── README.md
    └── simple.html
```

Upload **only** `dist/mapsight-assets/` so `/mapsight-assets/…` resolves.

---

## Snippet pattern

`index.html` is the **source of truth**. The paste-ready region is marked with `<!-- mapsight:snippet:start/end -->` and uses production deploy paths. Build extracts it to `dist/snippets/simple.html`.

```html
<!-- mapsight:snippet:start -->
<link rel="stylesheet" href="/mapsight-assets/assets/mapsight.css" />

<div id="mapsight-embed-demo" class="mapsight-embed"></div>

<script type="module">
	import browserEmbed from "/mapsight-assets/assets/embed.js";
	import {simpleMap} from "/mapsight-assets/assets/simpleMap.js";

	document.addEventListener("DOMContentLoaded", () => {
		const element = document.getElementById("mapsight-embed-demo");
		if (!(element instanceof HTMLElement)) {
			throw new Error("Mapsight embed container not found");
		}

		browserEmbed(
			element,
			simpleMap({
				imagesUrl: "/mapsight-assets/img/", <!-- mapsight:cms:replace imagesUrl … -->
				featureSourceUrl: "/mapsight-assets/data/demo.geojson",
			}),
		);
	});
</script>
<!-- mapsight:snippet:end -->
```

See `dist/snippets/simple.html` after build (with `dist/snippets/README.md` for integration links).

---

## Customize

| Goal                         | Edit                                                                                                                   |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Deploy URL prefix            | [`vite.config.mts`](vite.config.mts) → `HOST_ASSETS_BASE`                                                              |
| Dev deploy-path aliases      | [`vite.config.mts`](vite.config.mts) → `mapsightHostEmbedDevPlugin` in default mode                                    |
| Preset / map behaviour       | [`src/presets/simpleMap.ts`](src/presets/simpleMap.ts)                                                                 |
| Vector style (traffic icons) | [`src/vector-styles/demo.scss`](src/vector-styles/demo.scss) — rebuild via `npm run build:mapsightStyle`               |
| Styles                       | [`src/scss/mapsight-host.scss`](src/scss/mapsight-host.scss) — UI icons via `$ms3-iconPath: "~@mapsight/ui/dist/img/"` |
| Demo GeoJSON                 | [`public/data/demo.geojson`](public/data/demo.geojson)                                                                 |
| Embed plugin / snippets      | [`hostEmbedConfig`](vite.config.mts) → `snippetSources` + `@mapsight/vite-host-embed`                                  |

Add a new embed type: new preset in `src/presets/`, thin re-export in `entries/`, register in `HOST_EMBED_TYPE_ENTRIES` in [`vite.config.mts`](vite.config.mts), rebuild.
