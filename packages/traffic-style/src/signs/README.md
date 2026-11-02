# Authored sign components

These standalone SVG files are the source artwork for traditional sign
compositions. `bases/` contains the six frames; `glyphs/` contains twenty
symbols. Every component has `default`, `small`, `xsmall`, and `plain` variants
so its existing optical adjustments remain editable.

Keep each SVG root's dimensions, `fill="none"`, and `fill-rule="evenodd"`.
Edit paths and paints inside that root. Literal colors are the defaults.
An explicit `data-sign-fill` or `data-sign-stroke` attribute binds that paint to
`background`, `foreground`, or `border`. Unbound paints stay fixed. For example:

```svg
<path fill="#fff" data-sign-fill="background"
      stroke="#b80707" data-sign-stroke="border" d="…"/>
```

The compositor combines the named components in
`src/lib/icon/signs/catalog.ts` and replaces only those declared paints.
An omitted override keeps the asset's literal default. Traffic-light lamps and
visibility outlines deliberately have no bindings.

`build:sign-artwork` packages the SVG bodies into an internal JavaScript module
before TypeScript compilation. It validates variants and bindings; it does not
choose geometry, infer color roles, extract glyphs from full icons, or read a
design file. No external design export is needed to edit or build these signs.
The source SVGs are also copied into the published package under `src/signs/`.
