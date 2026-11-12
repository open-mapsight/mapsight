---
"@mapsight/ui": minor
---

Add the future flag `v8_attributionText`. When enabled, `metaData.attribution` is rendered as plain text; the default still renders it as HTML. Layers can set `dangerouslySetAttributionHtml` (new helper `metaDataWithAttributionHtml`) for attribution markup, which is always rendered as HTML and takes precedence over `attribution`. Hosts that build layer metadata from text they do not control should move HTML attributions to the new field and enable the flag.
