---
"@mapsight/vector-style-compiler": patch
---

The compiler now warns about styles that declare `circle-*` or `icon-*` properties but no `image-type`, since such styles draw no point symbol. The API reports warnings through the new optional `onWarning` callback and the CLI prints them; the generated output is unchanged. The README examples now set `image-type` and its duplicated sections are removed.
