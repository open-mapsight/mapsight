---
"@mapsight/count-aggregator-ui": minor
---

Add an opt-in `comparisonTooltip: "compact"` app setting with short station identifiers, metric labels and colour swatches. Full labels remain the default, and single-series tooltips retain their existing labels.

Fix intraday axis ticks for multi-day ranges, break line and area charts at missing resolution buckets without treating gaps as measurements, and disambiguate duplicate station names using existing station metadata. Export `buildStationLabels` for custom station selectors.
