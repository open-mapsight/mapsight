# Authored sign components

These standalone SVG files are the source artwork for traditional sign
compositions. `bases/` contains six frames; `glyphs/` contains twenty symbols.
Every component has `default`, `small`, `xsmall`, and `plain` variants so its
existing optical adjustments remain editable.

## Glyph artboards and placement

Glyphs use shared artboards within each variant: **24×24** for `default` and
`plain`, **16×16** for `small`, and **12×12** for `xsmall`. Keep their deliberate
padding and optical alignment; do not crop each glyph to its visible ink.
The local drawing describes how the glyph looks beside other glyphs, independently
of the base on which it will be placed. Coordinate-normalization groups inside
the SVG preserve the original path geometry and size-specific detail.

`compositions.json` owns base/glyph references and exact placement rectangles.
Each named placement gives `x`, `y`, `width`, and `height` in the base's coordinate
system for all four variants. The warning placement puts the shared glyph
artboard lower inside the triangle; the centered placement is used by the other
bases. A composition can reference another placement when it needs a different
optical adjustment. For example, `baustelle` selects:

```json
{"base": "warning-triangle", "glyph": "baustelle", "placement": "warning"}
```

Edit the SVG to change its artwork or local optical alignment. Edit composition
metadata to change where and at what size it appears in a base. The compositor
uses those fixed rectangles and the SVG's declared viewBox; it never computes
ink bounds, centers automatically, or chooses padding during the build.
The finished icon retains its original dimensions. Raster-parity tests compare
all legacy signs and size variants at both 1× and 2×.

## Paints

Keep each SVG root's dimensions, `fill="none"`, and `fill-rule="evenodd"`.
Edit paths and paints inside that root. Literal colors are the defaults.
An explicit `data-sign-fill` or `data-sign-stroke` attribute binds that paint to
`background`, `foreground`, or `border`. Unbound paints stay fixed. For example:

```svg
<path fill="#fff" data-sign-fill="background"
      stroke="#b80707" data-sign-stroke="border" d="…"/>
```

An omitted override keeps the asset's literal default. Traffic-light lamps and
visibility outlines deliberately have no bindings.

## Build

`build:sign-artwork` packages SVG bodies and viewBoxes into an internal JavaScript
module before TypeScript compilation. It validates variants, paint bindings and
composition references/placements; it does not choose geometry, infer color
roles, extract glyphs from full icons, or read a design file. No external design
export is needed to edit or build these signs. Source SVGs and composition
metadata are also copied into the published package under `src/signs/`.
