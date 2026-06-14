# Custom icon builds

Build **your own** icon assets from the traffic-style catalog — subset for smaller
deploys, **add custom tiles**, or pre-bake composable pictograms with app-specific
colors. The default package still ships the full catalog; these CLIs let consuming
apps tailor what lands in their bundle.

Install `@mapsight/traffic-style` as a dependency. The binaries are exposed as
`traffic-icon-sprite` and `traffic-composable-icons`.

For runtime pictograms without pre-baking, you can also call `registerPictograms`
from `@mapsight/traffic-style/pictograms` at app startup (same mechanism as the
Font Awesome pack).

For how sprite vs composable icons are classified, see [ICON_CATALOG.md](ICON_CATALOG.md).
For runtime pictogram packs, see the same doc.

## Monorepo / pnpm workspace

This package uses `publishConfig.linkDirectory: true` so workspace consumers
symlink to `dist/` instead of the package root. That mirrors the published tarball
layout and keeps workspace DX “hot”: apps import built assets from `dist` without
`pnpm pack` or republishing on every traffic-style change.

**Trade-off:** in this setup, pnpm does not reliably expose the `bin` shims
(`traffic-icon-sprite`, `traffic-composable-icons`, …) on `PATH` when you run app
scripts — even though the CLI files exist under
`node_modules/@mapsight/traffic-style/scripts/`. After `pnpm install` from the
registry, the bare command names work as documented below.

**Workaround in workspace apps:** invoke the script explicitly:

```json
{
	"scripts": {
		"build:iconSprite": "node node_modules/@mapsight/traffic-style/scripts/traffic-icon-sprite.js --output-scss tmp/ --output-img public/img/ --groups default,education"
	}
}
```

Same pattern for `traffic-composable-icons.js`. Use
`node_modules/@mapsight/traffic-style/meta.json` for `--meta-path` unless you are
editing `src/meta.json` locally and have not rebuilt traffic-style yet (then point
at `packages/traffic-style/src/meta.json` temporarily).

---

## Custom sprite sheets

Use `traffic-icon-sprite` to assemble a PNG sprite and matching SCSS map from the
pre-optimized icon PNGs in the package. Icons with `"render": "composable"` in
`meta.json` are skipped automatically.

### Typical workflow

1. Pick groups and variants from `meta.json` (e.g. `default`, `traffic`, `poi`,
   `education`, `numbers`, `letters`, …).
2. Run the CLI in your app build (output paths are up to you).
3. `@import` the generated SCSS in your vector style and point `icon-src` at your
   sprite image.

### Example

In a consuming app's `package.json` (registry install — bare CLI names on `PATH`):

```json
{
	"scripts": {
		"build:iconSprite": "traffic-icon-sprite --output-scss tmp/ --output-img public/img/ --groups default,education --variants default,small,xsmall"
	}
}
```

In a pnpm workspace linked to this repo, use the `node node_modules/…/scripts/…`
form from [Monorepo / pnpm workspace](#monorepo--pnpm-workspace) above instead.

### Defaults

| Option           | Default                                                       |
| ---------------- | ------------------------------------------------------------- |
| Source directory | `node_modules/@mapsight/traffic-style/img/mapsight-icons-2x/` |
| `meta.json`      | `node_modules/@mapsight/traffic-style/meta.json`              |
| Sprite name      | `mapsight-traffic-style-icon-sprite-2x`                       |
| Groups           | `default`                                                     |
| Variants         | `default`, `small`, `xsmall`                                  |

### Useful flags

```bash
# 1x assets instead of 2x
traffic-icon-sprite node_modules/@mapsight/traffic-style/img/mapsight-icons/ \
  --sprite-name my-app-icon-sprite-1x \
  --output-scss dist/scss/ --output-img public/img/

# Only traffic signs, plain variant
traffic-icon-sprite --groups traffic --variants plain \
  --output-scss tmp/ --output-img public/img/

# Replace individual tiles from your own PNGs (same filenames as in the package)
traffic-icon-sprite --overrides ./my-icon-overrides/ \
  --output-scss tmp/ --output-img public/img/

# Rebuild on changes while developing
traffic-icon-sprite --watch --output-scss tmp/ --output-img public/img/
```

Pass `--groups` with an empty value (`--groups ""`) to include every non-composable
icon for the selected variants.

### Adding custom sprite tiles

Drop PNGs into an overrides directory (same filenames as in the package, e.g.
`my-poi-default.png`, `my-poi-small.png`) and pass `--overrides`. The CLI merges
your tiles with the selected groups/variants and emits a new sprite sheet + SCSS
map. Wire the generated SCSS into your vector style via
`$MAPSIGHT_TRAFFIC_STYLE__ICONS` and `$MAPSIGHT_TRAFFIC_STYLE__SPRITE_PATH` — see
[CUSTOMIZING_SCSS.md](CUSTOMIZING_SCSS.md).

---

## Pre-baking composable icons

`traffic-composable-icons` mirrors the sprite filter model: select icons by
**group**, **id**, or **variant**, optionally override colors, and write PNG/SVG
files to disk. Use this when you want static assets (smaller runtime work, custom
hosting, or mixing composable tiles into a custom sprite) instead of client-side
composition for every variant.

### Example — POI services, traffic-style pack, 2× PNGs

```bash
traffic-composable-icons \
  --dest public/img/composable-2x \
  --meta-path node_modules/@mapsight/traffic-style/meta.json \
  --pack traffic-style \
  --groups poi,poi-services \
  --variants default,plain \
  --scale 2
```

### More examples

```bash
# Explicit icon list with shared background override
traffic-composable-icons --dest ./out --icons museum,apotheke,kindergarten \
  --background "#035799" --variants default,small

# Font Awesome pack only
traffic-composable-icons --dest ./out --pack fontawesome --variants default,plain

# Single compact id (fa-* requires --pack fontawesome)
traffic-composable-icons --dest ./out --pack fontawesome \
  --mapsight-icon-id "fa-school/#003366/#ffffff" --variants default,plain

# SVG only (useful for inspection or non-raster pipelines)
traffic-composable-icons --dest ./out --groups poi-cultural --format svg
```

### Defaults

| Option      | Default                                                 |
| ----------- | ------------------------------------------------------- |
| `meta.json` | package `meta.json` (or `src/meta.json` in development) |
| `--pack`    | `traffic-style`                                         |
| Variants    | `default`, `small`, `xsmall`, `plain`                   |
| Scale       | `1`                                                     |
| Format      | `png` (`--format svg` or `--svg` for SVG / both)        |

`--pack` accepts `traffic-style`, `fontawesome`, or a comma-separated list. Icon ids
starting with `fa-` belong to the Font Awesome pack; all other composable ids use
traffic-style pictograms. Combine `--pack` with `--groups` / `--icons` to subset
within a pack.

The default package build (`pnpm run build:composable-icons`) pre-bakes **traffic-style
only** (not Font Awesome).

### Adding custom composable pictograms

**Runtime** — register SVG path data before the map renders:

```ts
import {registerPictograms} from "@mapsight/traffic-style/pictograms";

registerPictograms([
	{
		id: "my-poi",
		source: "traffic-style",
		viewBox: "0 0 24 24",
		markup: '<path d="M12 2…" fill="currentColor"/>',
	},
]);
```

Features can then use `{ "mapsightIconId": "my-poi" }` or
`{ "mapsightIconId": "my-poi/#035799" }`.

**Build-time** — add entries to your own `meta.json`, point
`traffic-composable-icons --meta-path` at it, and bake PNG/SVG assets. Useful when
you want static files, custom hosting, or tiles mixed into a custom sprite.

To add icons to the **published package catalog**, see [DEVELOPMENT.md](DEVELOPMENT.md).
