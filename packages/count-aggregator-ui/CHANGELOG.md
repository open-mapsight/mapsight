# @mapsight/count-aggregator-ui

## 2.0.0

### Minor Changes

- 0ae0039: Add multi-metric chart series, metric selection in the wizard, and station-type-driven metric defaults from the platform API.
- 4cc9440: Export station type categories from the API client and add `groupStationTypesByCategory` for hub-style UIs.
- 98e314f: Add station-type unit and precision display for count-aggregator charts from platform metadata.

### Patch Changes

- 5743b4a: Export async status components subpath and migrate count-aggregator-ui loading states to shared QueryStatusRegion and AsyncStatusRegion.
- feab8d1: Expose smart city metric action links, data view request events, and station type count summaries.
- Updated dependencies [5743b4a]
- Updated dependencies [5743b4a]
- Updated dependencies [5743b4a]
- Updated dependencies [0ae0039]
- Updated dependencies [4cc9440]
- Updated dependencies [98e314f]
- Updated dependencies [7d48f25]
- Updated dependencies [b7d0ece]
- Updated dependencies [f16212e]
- Updated dependencies [b919f0b]
- Updated dependencies [0acda06]
- Updated dependencies [b755930]
- Updated dependencies [ee1ed8c]
    - @mapsight/ui@7.3.0
    - @mapsight/count-aggregator-api@1.1.0

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
