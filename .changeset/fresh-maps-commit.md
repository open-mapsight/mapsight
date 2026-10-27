---
"@mapsight/ui": minor
---

Add an opt-in renderer commit callback so asynchronous host renderers can defer afterRender plugins until React commits. Use the contract in the default browser renderer and Instance, and pin React-Redux hydration to the initial serverState snapshot.

Keep initial UI markup deterministic across browser capabilities, dialog portals, bottom-sheet sizing, icon caches, locale defaults and serialized dates. Hosts using asynchronous custom renderers should call props.deferCommit() before scheduling React and pass its callback to AppContext.onCommit; implicit UI language now defaults to de on both server and client.
