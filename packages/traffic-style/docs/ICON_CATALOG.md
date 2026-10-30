# Icon catalog

How icons are classified in `@mapsight/traffic-style`, how they are referenced on
features, and how pictogram packs affect the runtime bundle.

For map integration with `@mapsight/ui`, see the [README](../README.md#quick-start-with-mapsightui).
For standalone integration, see [ICON_INTEGRATION.md](ICON_INTEGRATION.md).
For caching internals, see [RUNTIME_ICONS.md](RUNTIME_ICONS.md).
For subsetting assets at build time, see [CUSTOM_ICON_BUILDS.md](CUSTOM_ICON_BUILDS.md).

---

## Sprite vs composable

Icons are classified as pre-baked **sprite** assets or **composable** pictograms. These
terms describe different layers: composable is a catalog/build classification;
**runtime icon** is the rendering engine that draws composable icons on the client.

Each icon in `meta.json` has a `render` field:

| `render`               | Meaning                                                                                                                                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`sprite`** (default) | Pre-composed PNG variants baked into the icon sprite (`stau`, triangles, complex signs). Built by the sprite pipeline; features reference them with a plain `mapsightIconId`.                                                              |
| **`composable`**       | Assembled at render time from pictogram SVGs in `src/pictograms/` and templates in `src/lib/pictograms/` (generated data in `src/generated/pictograms/`). Excluded from the sprite build; always rendered through the runtime icon system. |

---

## Compact `mapsightIconId`

Features store icons as a single string property:

```json
{ "mapsightIconId": "museum" }
{ "mapsightIconId": "museum/#be123c" }
{ "mapsightIconId": "museum/#be123c/#ffffff" }
```

Format: `pictogramOrLabel[/background[/foreground[/border]]]`

- Colors are optional. For POI pictograms and labels, omitted foreground is chosen
  automatically for contrast when a background is supplied.
- **Variant** (`default` / `small` / `xsmall` / `plain`) comes from zoom rules in
  SCSS, not from the compact id.
- Cache keys are `mapsightIconId|variant`.

Parse and format compact ids (dev tooling):

```ts
import {
	formatMapsightIcon,
	parseMapsightIcon,
} from "@mapsight/traffic-style/runtime-dev";
```

### Traditional traffic and parking signs

The sprite icons in the `traffic` and `poi-parking` groups also support runtime
composition with color overrides. Bare ids keep using the existing sprites;
adding `/` selects the runtime path on maps and in `MapsightIcon`.

```json
{ "mapsightIconId": "baustelle" }
{ "mapsightIconId": "baustelle/#ffffcc" }
{ "mapsightIconId": "baustelle//#333333" }
{ "mapsightIconId": "baustelle///#2266cc" }
{ "mapsightIconId": "baustelle/#ffffcc/#333333/#2266cc" }
{ "mapsightIconId": "parkflaeche/#2266cc/#ffffff" }
```

For signs, **each omitted or empty color slot keeps its original SVG color**:
`background` changes the sign face, `foreground` changes the symbol, and `border`
changes the red warning/restriction band where present. Outer white/black
visibility outlines and the red/amber/green lamps in `ampel` stay unchanged.
Signs without a separate band ignore `border`; a symbol-free `vollsperrung`
ignores `foreground`.

The recipes share identical SVG base layers and preserve the artwork of each
size, including existing small-size parking fallbacks. They are generated from
`src/icons/` during `build:pictograms:signs`; edit those source SVGs rather than
generated data. The other sprite families (flags, `ort`, `stadtteil`) remain
unchanged. `render: "sprite"` continues to describe the default asset path, so
existing sprite builds and catalog filters retain their behavior.

Direct composition and single-icon pre-baking accept these ids too:

```ts
import {composeSvg, uiIconSrc} from "@mapsight/traffic-style/icon";

const svg = composeSvg({
	pictogram: "baustelle",
	colors: {border: "#2266cc"},
});
const icon = uiIconSrc("baustelle///#2266cc", "plain");
```

```bash
traffic-composable-icons --dest ./out \
  --mapsight-icon-id "baustelle///#2266cc" --format both
```

---

## Pictogram packs (runtime)

Pictogram SVG paths are shipped as separate **packs** so the default JS bundle stays
small:

| Pack                        | Import                                                                                             | Pictogram ids                        |
| --------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------ |
| **traffic-style** (default) | loaded automatically via `@mapsight/traffic-style/runtime` or `@mapsight/traffic-style/pictograms` | `museum`, `apotheke`, … (~36 glyphs) |
| **fontawesome** (opt-in)    | `import "@mapsight/traffic-style/pictograms-fontawesome"`                                          | `fa-school`, `fa-hospital`, …        |

Packs register into a shared runtime catalog. Import a pack once at app startup
(before rendering `fa-*` icons). Without the Font Awesome import, `fa-*` ids fall
back to the default marker icon at runtime.

---

## Build-time vs runtime customization

| Layer                                                              | What you customize                                           | Effect                                                                                  |
| ------------------------------------------------------------------ | ------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| **Build-time** (`traffic-icon-sprite`, `traffic-composable-icons`) | `--groups`, `--variants`, `--icons`, `--pack`, `--overrides` | Subset or extend the assets in _your_ deploy artifact                                   |
| **Runtime**                                                        | Pack imports, `registerPictograms`                           | Control which SVG paths are in your JS bundle; add custom pictograms without pre-baking |

Prefer **build-time pre-baking** (`traffic-composable-icons`) for large static subsets.
Use **runtime composition** (`registerPictograms` or pack imports) for dynamic colors,
custom glyphs, or rarely shown ids.

---

## Default assets shipped with the package

Two ways to use the **default** icon assets without running the CLIs:

1. **Sprite sheets** — `mapsight-traffic-style-icon-sprite-1x.scss` and
   `mapsight-traffic-style-icon-sprite-2x.scss`, with matching PNGs under `img/`
   (already optimized)
2. **Individual files** — `img/mapsight-icons/*.png`, `img/mapsight-icons-2x/*.png`,
   and `img/mapsight-icons-svg/*.svg` (also already optimized), including
   composable catalog icons such as `fa-route-plain.png`

To subset, add custom tiles, or register your own pictograms, see
[CUSTOM_ICON_BUILDS.md](CUSTOM_ICON_BUILDS.md).
