---
"@mapsight/ui": minor
---

Name and describe the map surface for assistive technology. `.ms3-map-target` is a region with a translated role description and an accessible name (`mapTitle` prop, default "Interaktive Karte"; hosts may also pass `aria-label` or `aria-labelledby`). With keyboard control enabled, the map references its keyboard help (`ui.map.usage.html`, now including Shift+F10) via `aria-describedby`; the help renders as a visually hidden sibling of `.ms3-map-target`. The map target gets a visible `:focus-visible` ring.
