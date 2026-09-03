# @mapsight/count-aggregator-ui

## 3.1.1

### Patch Changes

- b33af3d: Show calendar dates on metric-widget chart axes for daily and coarser series
- 99f002d: Bump dependencies from Dependabot ([#240](https://github.com/open-mapsight/mapsight/pull/240)):

    - `@tanstack/react-query` `^5.101.4` → `^5.102.4` (minor)

- Updated dependencies [`99f002d`, `0ac9dc5`, `691da32`, `85af82f`, `90ea3c9`, `2bbb899`, `9ba015e`, `0cdb4a1`, `85ad6ef`, `51c4d1b`]:
    - `@mapsight/ui@7.5.0 → 7.5.1` (patch)

## 3.1.0

### Minor Changes

- 3d7f91a: Add wizard Rohwerte mode (`features.rawValues`) that fetches unaggregated raw values and CSV.
- 9eb9ff8: Add UBA Luftqualitätsindex band helpers, citizen-facing AQI badges and wind-direction compass widgets, and expand smart-city icon aliases for the new station types.

### Patch Changes

- 72a1544: Export `CountAggregatorProvider` and `createStationTypeAppsConfig` from the `/headless` entry for custom UIs.
- 4506976: Show formatted value and time when hovering feature-detail metric charts
- 4903225: Format metric widget last-updated dates in UTC so end-of-day `lastDateTime` stamps keep the API calendar day in timezones ahead of UTC.
- 6dba896: Export `cn`, typecheck tests from the package `tsconfig.json`, and document CMS stylesheet load order
- Updated dependencies [`3d7f91a`, `8666339`, `9eb9ff8`, `1153f61`, `e2ce340`, `b5c43bb`, `676a9fe`, `3fb5686`, `08f8e3f`, `b443c6e`, `aa41f30`, `71791b4`, `7be56da`, `b267418`, `a6a21d5`, `3f4ba18`]:
    - `@mapsight/count-aggregator-api@1.3.0 → 1.4.0` (minor)
    - `@mapsight/ui@7.4.2 → 7.5.0` (minor)

## 3.0.0

### Patch Changes

- 5de7693: Bump dependencies from Dependabot ([#139](https://github.com/open-mapsight/mapsight/pull/139)).
- Updated dependencies [`114126c`, `65ce23a`, `c58c407`, `1710d90`]:
    - `@mapsight/count-aggregator-api@1.2.1 → 1.3.0` (minor)
    - `@mapsight/ui@7.3.2 → 7.4.0` (minor)

## 2.0.2

### Patch Changes

- 01bb11d: Declare MIT license in package manifests.
- Updated dependencies [01bb11d]
    - @mapsight/count-aggregator-api@1.2.1
    - @mapsight/ui@7.3.2

## 2.0.1

### Patch Changes

- 1631abc: Replace removed `bicycleCount` station type with `bicycleSensorTotal` across the OpenAPI contract, UI, showcase demo, and smart-city icon aliases.
- Updated dependencies [1631abc]
- Updated dependencies [68d687a]
    - @mapsight/count-aggregator-api@1.2.0
    - @mapsight/ui@7.3.1

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
