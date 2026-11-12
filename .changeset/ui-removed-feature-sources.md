---
"@mapsight/ui": patch
---

Handle feature sources that are removed at runtime. A feature list bound to a source that is not in the state, or a combined list whose members were removed, now shows its empty state instead of loading forever (`featureSourceToView` treats a missing source and missing combined members as settled). The `combinedVisibleLayers` plugin no longer recreates a removed combined source when a layer is toggled, and synchronises again when the source is added back.
