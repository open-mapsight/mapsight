---
"@mapsight/ui": minor
---

Improve accessibility of search, switchers, translations and control tooltips.

Search now announces debounced loading, result counts and errors in a separate polite status. Pass `announceResults={false}` to `Search` when the host supplies announcements. After selecting a result, focus moves to visible details or the selected list row, falling back to the search input with a selection announcement. `onResultSelected(feature)` runs after rendering so hosts can move focus themselves. The shared `QueryInput` now exposes its input ref on initial mount.

Base-map radio groups keep the checked radio enabled, use one Tab stop, and move focus and selection with arrow keys. Re-selecting the checked map does nothing. Radio names contain only the layer title. Collapsible group toggle names include their complete visible label and count.

Layer and tag switchers accept `headlineAs` (default `h3`); split layer switchers also accept `groupHeadlineAs` (default `h4`). Search accepts `groupHeadlineAs` (default `h4`). Hosts can choose a suitable heading level or `div` for non-structural control labels. Existing heading defaults are retained.

Regional locales such as `en-GB` fall back to their base language while exact host translations still take precedence. Add missing shared labels and search messages, and verify literal translation-key coverage in German and English.

Control tooltips use the hoverable, Escape-dismissible ARIA tooltip by default. Hosts can retain hint.css with `future.v8_ariaControlTooltip: false`.
