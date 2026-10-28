# @mapsight/a11y-audit

## 0.1.0

### Minor Changes

- 7555e3b: Add `@mapsight/a11y-audit`, a rerunnable accessibility audit for Mapsight integrations. A config lists the pages that embed Mapsight and the tasks to replay; each run combines axe-core (WCAG 2.2 A/AA) with keyboard, dialog, map, language, text-spacing and reflow checks, attributes findings to owners (host, `@mapsight/ui`, OpenLayers), diffs against a baseline by stable fingerprints, and fills a WCAG coverage matrix that only passes criteria once their manual tests pass.
