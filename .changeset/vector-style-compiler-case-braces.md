---
"@mapsight/vector-style-compiler": patch
---

Brace generated `switch` case bodies so multiple simple styles with `const` bindings do not collide (TDZ / redeclare errors under Vite/Oxc).
