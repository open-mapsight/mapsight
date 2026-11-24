---
"@mapsight/core": minor
"@mapsight/ui": minor
---

Add the per-store `v15_unsetRemovesKey` future flag to `createMapsightStore` (`options.future`) and `v8_unsetRemovesKey` to `createOptions.future` of `@mapsight/ui`. With the flag enabled, `unset(path)` deletes a key from its plain object parent before JSON serialization. Array elements and a plain `set(path, undefined)` still store `undefined`. The next major enables deletion by default. Until then, use `removeKey`, `removeLayer` and `removeFeatureSource` to delete keys in both modes.

Complete Node embed snapshots carry deletions from the server's initial state through hydration. Unmarked partial states still merge over the client base config.
