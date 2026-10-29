---
"@mapsight/core": patch
---

Keep the filtered feature source selector's result stable while neither the source state nor its filter values change. The featuresKey fast path rebuilt the result on every call, so every `SharedReadonlyVectorFeatureSource` (and list) subscriber ran on every Redux dispatch and fingerprinted all features of its source again; with a few thousand features that cost 10–100 ms per dispatch and dropped pinch zoom on mid-range phones to ~25 fps. `SharedReadonlyVectorFeatureSource` also skips the fingerprint when only collection metadata changed and the features array is the same.
