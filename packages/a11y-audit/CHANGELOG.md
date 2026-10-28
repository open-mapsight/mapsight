# @mapsight/a11y-audit

## 0.2.0

### Minor Changes

- 8ce5ee0: Allow feature details to omit their landmark inside a named sheet via `landmark={false}`, remove nested banner semantics, avoid empty page headings, keep collapsed scroll regions out of the tab order, and preserve layer-switcher hover/focus contrast. Give station and date inputs accessible names and a visible keyboard focus indicator on station selection.

    Support config/target navigation timeouts in accessibility audits, correct fixed-position visibility checks, and return a nonzero exit code for incomplete runs or invalid baseline gates.

## 0.1.0

### Minor Changes

- 7555e3b: Add `@mapsight/a11y-audit`, a rerunnable accessibility audit for Mapsight integrations. A config lists the pages that embed Mapsight and the tasks to replay; each run combines axe-core (WCAG 2.2 A/AA) with keyboard, dialog, map, language, text-spacing and reflow checks, attributes findings to owners (host, `@mapsight/ui`, OpenLayers), diffs against a baseline by stable fingerprints, and fills a WCAG coverage matrix that only passes criteria once their manual tests pass.
