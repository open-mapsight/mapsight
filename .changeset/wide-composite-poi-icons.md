---
"@mapsight/traffic-style": minor
"@mapsight/ui": minor
"@mapsight/vector-style-compiler": minor
"@mapsight/lib-ol": patch
---

Add standard `wc` and compact `wc-accessible` POI icons using Font Awesome Free glyphs. Support horizontal compositions with one shared frame and full-sized glyphs across all variants. Carry independent bitmap dimensions through runtime styles, OpenLayers and proportional UI/list rendering; preserve existing square icons and uppercase `WC` text labels. Include the runtime dimension helper in compiler imports and IDE metadata.

Convert computed circle radii to numbers before constructing OpenLayers selection halos. Declare traffic-style’s direct lib-js dependency used by its precompiled style.
