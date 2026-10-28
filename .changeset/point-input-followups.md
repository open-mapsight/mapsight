---
"@mapsight/core": patch
"@mapsight/ui": patch
---

PointInputControls confirm with Enter or Space and wait for a running pan to end, so the point lands under the crosshair. The status updates once the map stops moving and reports confirmation while the stored point is at the centre. The source projection is derived from the editor, and a `crs` is only written for non-geographic sources or to keep an existing one accurate.

Keyboard measure and share-position drawing also wait for a running pan, and every keyboard crosshair follows view padding. Native keyboard pan/zoom only read the motion preference for key events, and in-flight reduced-motion handling falls back to execution-time behaviour if OpenLayers' internal animation queue changes.
