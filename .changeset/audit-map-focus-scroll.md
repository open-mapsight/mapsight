---
"@mapsight/a11y-audit": patch
---

Measure the map viewport after focusing it for the keyboard-pan check. Focusing a map below the fold can scroll the host document; the previous rectangle could inspect static content instead of the map, causing false failures or silently unjudged checks. Regression coverage checks both working and broken arrow-key behavior after focus scrolls the page.
