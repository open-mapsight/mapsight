---
"@mapsight/count-aggregator-ui": patch
---

Improve count aggregator chart and wizard presentation.

Charts now handle empty loaded datasets with a visible empty state, format axis
and tooltip values with the document locale, trim metric suffixes from station
labels, and give column charts better date-domain padding and bar spacing.

The wizard result view now prioritizes the chart and download sections before
the selection summary, and the date-range controls add today, last 7 days, and
last 30 days presets while keeping the calendar popup positioned correctly
inside the count-aggregator portal.
