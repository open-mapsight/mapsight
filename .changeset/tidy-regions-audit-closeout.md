---
"@mapsight/ui": minor
"@mapsight/a11y-audit": minor
"@mapsight/count-aggregator-ui": patch
---

Allow feature details to omit their landmark inside a named sheet via `landmark={false}`, remove nested banner semantics, avoid empty page headings, keep collapsed scroll regions out of the tab order, and preserve layer-switcher hover/focus contrast. Give station and date inputs accessible names and a visible keyboard focus indicator on station selection.

Support config/target navigation timeouts in accessibility audits, correct fixed-position visibility checks, and return a nonzero exit code for incomplete runs or invalid baseline gates.
