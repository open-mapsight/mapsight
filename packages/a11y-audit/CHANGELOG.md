# @mapsight/a11y-audit

## 0.2.2

### Patch Changes

- 02dcdf1: Measure the map viewport after focusing it for the keyboard-pan check. Focusing a map below the fold can scroll the host document; the previous rectangle could inspect static content instead of the map, causing false failures or silently unjudged checks. Regression coverage checks both working and broken arrow-key behavior after focus scrolls the page.

## 0.2.1

### Patch Changes

- 374a3e4: Use the native TypeScript 7 compiler for typechecks and library builds while preserving the TypeScript 6 API for existing tools and the UI's public React prop declarations.

## 0.2.0

### Minor Changes

- 8ce5ee0: Allow feature details to omit their landmark inside a named sheet via `landmark={false}`, remove nested banner semantics, avoid empty page headings, keep collapsed scroll regions out of the tab order, and preserve layer-switcher hover/focus contrast. Give station and date inputs accessible names and a visible keyboard focus indicator on station selection.

    Support config/target navigation timeouts in accessibility audits, correct fixed-position visibility checks, and return a nonzero exit code for incomplete runs or invalid baseline gates.

## 0.1.0

### Minor Changes

- 7555e3b: Add `@mapsight/a11y-audit`, a rerunnable accessibility audit for Mapsight integrations. A config lists the pages that embed Mapsight and the tasks to replay; each run combines axe-core (WCAG 2.2 A/AA) with keyboard, dialog, map, language, text-spacing and reflow checks, attributes findings to owners (host, `@mapsight/ui`, OpenLayers), diffs against a baseline by stable fingerprints, and fills a WCAG coverage matrix that only passes criteria once their manual tests pass.
