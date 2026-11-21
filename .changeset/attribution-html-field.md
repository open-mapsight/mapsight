---
"@mapsight/core": minor
---

Add the optional layer metadata field `dangerouslySetAttributionHtml` for attribution markup, and the selector `visibleLayerAttributionPartsSelector`, which returns `{text?, html?}` per visible layer so renderers can treat plain text and HTML deliberately. `layerAttributionsSelector` and `visibleLayerAttributionsSelector` are unchanged.
