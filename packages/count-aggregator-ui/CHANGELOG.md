# @mapsight/count-aggregator-ui

## 1.0.1

### Patch Changes

- 25c5f29: Improve count aggregator chart and wizard presentation.

    Charts now handle empty loaded datasets with a visible empty state, format axis
    and tooltip values with the document locale, trim metric suffixes from station
    labels, and give column charts better date-domain padding and bar spacing.

    The wizard result view now prioritizes the chart and download sections before
    the selection summary, and the date-range controls add today, last 7 days, and
    last 30 days presets while keeping the calendar popup positioned correctly
    inside the count-aggregator portal.

- Updated dependencies [25c5f29]
- Updated dependencies [25c5f29]
    - @mapsight/ui@7.2.1

## 1.0.0

### Major Changes

- 7ca8a3e: Initial release of count-aggregator React UI: station wizard, time-series charts, CSV export, metric widgets for feature details, and headless exports.

    ***

### Patch Changes

- Updated internal dependencies.
