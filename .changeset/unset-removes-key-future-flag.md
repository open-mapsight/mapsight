---
"@mapsight/core": minor
"@mapsight/ui": minor
---

Add the `v15_unsetRemovesKey` future flag to `createMapsightStore` (`options.future`) and `v8_unsetRemovesKey` to `createOptions.future` of `@mapsight/ui`. With the flag on, `unset(path)` deletes the key from a plain object parent instead of leaving it in the state with an `undefined` value, so the state survives serialisation and matches its types. Array elements are still set to `undefined`, a plain `set(path, undefined)` is unchanged, and without the flag nothing changes. The flag is read per store. In the next major, `unset` deletes the key by default; until then, use `removeKey`, `removeLayer` and `removeFeatureSource` to remove things in both modes.
