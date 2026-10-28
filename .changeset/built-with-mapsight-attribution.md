---
"@mapsight/ui": minor
---

Replace the map watermark with the approved **Erstellt mit Mapsight** / **Built with Mapsight** attribution mark. `.ms3-logo` is now a link to `https://open-mapsight.org/` in the same tab, its accessible name is the visible text (`ui.map-overlay.logo.copyright`), and it shows a `:focus-visible` ring. German and English follow the UI language; other languages use the German mark. Desktop keeps 120×40 CSS px, mobile and map-only views 90×30. The mark keeps its opaque light backing and is no longer dimmed. The SVGs ship in `dist/img/mapsight-ui/` (`built-with-mapsight-{de,en}-{120x40,90x30}-light.svg`) and load through `$ms3-iconPath` without external requests. `watermark.svg` remains as a copy of the German 120×40 mark.

The mark stays optional. Hide or restyle it with CSS on `.ms3-logo` as before, or use the new `components.MapOverlayLogo` create option (`() => null`, or your own component). The `MapOverlayBottomLeft` and `MapOverlayModal` slots are unchanged. Hosts that copy UI icons into their own icon path need the new files; replacing `watermark.svg` there no longer changes the default mark. See the [trademark policy](https://github.com/open-mapsight/mapsight/blob/main/docs/TRADEMARK.md#logos-and-visual-identity).
