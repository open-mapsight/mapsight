---
"@mapsight/core": patch
---

Stop `DrawInteraction` from stacking measurement listeners on every map attach and drop its debug logging, and let `TranslateInteraction` actually remove its source listeners when the source changes
