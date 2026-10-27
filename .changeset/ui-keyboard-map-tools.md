---
"@mapsight/ui": minor
---

Add opt-in keyboard drawing for distance measurement and position sharing. Pass `keyboardDrawing: true` to the measure-distance and share-position-link plugins (default `false`, so existing hosts keep pointer-only drawing). While a tool is active and the map has focus, Enter or Space adds a point at the map centre (marked with a crosshair), arrow keys pan, Backspace removes the last point, and Enter finishes a measurement after two points. The tool overlays then offer "Done" (measurement) and "Share map centre" (position sharing).

Independently of the option, the measured distance is announced, and a keyboard-opened point menu (Shift+F10) opens at the current map centre instead of the last pointer position.
