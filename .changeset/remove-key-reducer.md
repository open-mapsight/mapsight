---
"@mapsight/lib-redux": minor
---

Add the `removeKey` reducer to `@mapsight/lib-redux/reducers/immutable` and `@mapsight/lib-redux/reducers/immutable-path`. It deletes an own key from the plain object at the path, gives the parents new references, keeps siblings and returns the same state when the key or its parent does not exist or the parent is an array.
