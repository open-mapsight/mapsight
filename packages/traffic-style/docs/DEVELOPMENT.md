# Package development

Contributing to `@mapsight/traffic-style`: tests, adding icons, and publishing.

---

## Testing

Runtime icon behavior is covered by Vitest unit tests in `src/lib/icon/` and
`src/lib/runtime/`. Run them with:

```bash
pnpm test
```

See [RUNTIME_ICONS.md](RUNTIME_ICONS.md) for architecture and test coverage notes.
For customizing the style, see [CUSTOMIZING_SCSS.md](CUSTOMIZING_SCSS.md).

---

## Adding a composable POI icon

For simple POI pictograms, prefer the composable path over sprite baking:

1. Export pictogram SVG → `src/pictograms/`
2. Run `pnpm run build:pictograms`
3. Add to `src/meta.json` with `"render": "composable"`

Do **not** add composable icons to the sprite pipeline.

Optional per-icon default colors in `src/meta.json`:

```json
"museum": {
  "render": "composable",
  "colors": {
    "background": "#035799",
    "foreground": "#ffffff"
  }
}
```

When `foreground` is omitted, contrast is chosen automatically (same as runtime).

Pre-bake composable PNG/SVG assets for the default package build:

```bash
pnpm run build:composable-icons
```

---

## Adding a new sprite icon

Use this workflow for complex icons that need pre-baked sprite assets (traffic signs,
multi-part symbols, etc.). For simple POI pictograms, use the composable path above.

1. Add a **vector based** icon symbol to `docs/icons.sketch` and export the symbols
   (see others for reference)
2. Add SVGs (at least `-default.svg` and `-plain.svg`, optionally `-small.svg` and
   `-xsmall.svg`) to `img/mapsight-icons-svg/`
3. Add 1× PNGs (at least `-default.png` and `-plain.png`, optionally `-small.png` and
   `-xsmall.png`) to `img/mapsight-icons/`
4. Add 2× PNGs (at least `-default.png` and `-plain.png`, optionally `-small.png` and
   `-xsmall.png`) to `img/mapsight-icons-2x/`
5. Describe the new icon in `src/meta.json`
6. Optionally add it to the fallback map in `src/scss/_variables.scss`
7. Search and replace cache-busting strings in `src/scss/**` in the format
   `?v=xxxx-xx-xx-xx-xx` (TODO: automate or centralize in one file)
8. Build everything using `pnpm run clean-build`

---

## Publishing

```bash
git status
git commit
pnpm version x.x.x|major|minor|patch
pnpm run publish
git push
git push --tags
```
