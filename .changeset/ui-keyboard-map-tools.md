---
"@mapsight/ui": minor
---

Make distance measurement and position sharing usable with the keyboard. While a tool is active and the map has focus, Enter or Space adds a point at the map centre (marked with a crosshair), arrow keys pan, Backspace removes the last point, and Enter finishes a measurement after two points. The measurement overlay gets a "Done" button, and position sharing a "Share map centre" button. The measured distance is announced. Plugins accept `keyboardDrawing` (default `true`); set it to `false` to keep pointer-only drawing. A keyboard-opened point menu (Shift+F10) now opens at the current map centre instead of the last pointer position.
