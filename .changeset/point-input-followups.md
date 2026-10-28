---
"@mapsight/core": patch
"@mapsight/ui": patch
---

PointInputControls confirm with Enter or Space and wait for a running pan to end, so the point lands under the crosshair. The status updates once the map stops moving and reports confirmation while the stored point is at the centre. The source projection is derived from the editor, and a `crs` is only written for non-geographic sources or to keep an existing one accurate.

Keyboard measure and share-position drawing also wait for a running pan. Every keyboard crosshair follows view padding and only appears with the map's keyboard focus indicator (`:focus-visible`), not after a pointer click. The measure and share overlays keep their instructions to one sentence and list the keys in a collapsed “Keyboard controls” disclosure (react-aria-components `Disclosure`, styleable via `[data-expanded]`/`[data-focus-visible]`). While a keyboard tool is open, a “Skip to the map” link in its overlay and a “Back to …” link right after the map connect the two without trapping focus; both appear only on keyboard focus (`.ms3-skip-link`). “Share map centre” is now a visually secondary action. Native keyboard pan/zoom only read the motion preference for key events, and in-flight reduced-motion handling falls back to execution-time behaviour if OpenLayers' internal animation queue changes.
