---
"@mapsight/ui": patch
---

Add more flexible layer switcher presentation options.

Layer switchers can now render base layers in their own section while keeping
overlay layers grouped separately, with base layer entries isolated from feature
source updates. Feature lists can also render the external layer switcher behind
a compact filter-toggle control.

The default layer switcher CSS stays intentionally minimal; the richer split
layout sizing, spacing, and expanded overlay dimensions live in the existing
`2022-03` theme.
