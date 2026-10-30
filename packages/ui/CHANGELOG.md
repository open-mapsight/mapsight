# @mapsight/ui

## 7.11.0

### Minor Changes

- 6e1979d: Add opt-in compact feature-source indexes to nodeEmbed dehydration. The wire
  snapshot omits ids/featuresById while retaining source collections, metadata,
  selections, combined data, and edit history. Existing core normalization restores
  indexed runtime state before React hydration; full snapshots remain the default.

### Patch Changes

- dedaf83: Preserve unchanged loaded feature data and derived indexes when applying JSON-style configuration. Add opt-in `mergeConfig`/`mergeConfigAll` actions and use them in `resetMapsightCore`, retaining selection resets, path routing and existing deep-merge value semantics.
- 8394258: Avoid SSR renderAsync timeouts when a disabled/default list references an
  unconfigured feature source, or an ordinary load would skip an already-failed
  source. Continue awaiting configured first-paint data and combined members, and
  preserve explicit forced-refresh retries.
- Updated dependencies [`6e1979d`, `8394258`, `dedaf83`]:
    - `@mapsight/core@14.6.8 → 14.7.0` (minor)
    - `@mapsight/lib-redux@2.2.5 → 2.3.0` (minor)

## 7.10.1

### Patch Changes

- 6f5e113: Stop re-rendering the split base-layer switcher and all its entries on every Redux dispatch. Its state selector recomputed and returned new layer id arrays each time (map view updates while panning included); it now memoises per instance and keeps the previous result while the split is unchanged. Collapsible overlay groups are memoised and get a stable toggle handler.
- 374a3e4: Use the native TypeScript 7 compiler for typechecks and library builds while preserving the TypeScript 6 API for existing tools and the UI's public React prop declarations.
- b4d67eb: Refresh compatible runtime and build dependencies, including React Redux, TanStack Query, Vite, Next.js, and Sass 1.106.1 with its empty-attribute-selector fix. Update transitive build tools to patched versions.
- Updated dependencies [`ab13ef7`, `2270229`, `eed3ab3`, `374a3e4`, `2d13e3d`, `957ed95`, `b4d67eb`, `59c334d`]:
    - `@mapsight/core@14.6.7 → 14.6.8` (patch)
    - `@mapsight/lib-ol@4.3.2 → 4.3.3` (patch)

## 7.10.0

### Minor Changes

- ff3adb5: Replace the map watermark with the approved **Erstellt mit Mapsight** / **Built with Mapsight** attribution mark. `.ms3-logo` is now a link to `https://open-mapsight.org/` in the same tab, its accessible name is the visible text (`ui.map-overlay.logo.copyright`), and it shows a `:focus-visible` ring. German and English follow the UI language; other languages use the German mark. Desktop keeps 120×40 CSS px, mobile and map-only views 90×30. The mark keeps its opaque light backing and is no longer dimmed. The SVGs ship in `dist/img/mapsight-ui/` (`built-with-mapsight-{de,en}-{120x40,90x30}-light.svg`) and load through `$ms3-iconPath` without external requests. `watermark.svg` remains as a copy of the German 120×40 mark.

    The mark stays optional. Hide or restyle it with CSS on `.ms3-logo` as before, or use the new `components.MapOverlayLogo` create option (`() => null`, or your own component). The `MapOverlayBottomLeft` and `MapOverlayModal` slots are unchanged. Hosts that copy UI icons into their own icon path need the new files; replacing `watermark.svg` there no longer changes the default mark. See the [trademark policy](https://github.com/open-mapsight/mapsight/blob/main/docs/TRADEMARK.md#logos-and-visual-identity).

- a27f576: “Share place” (`SharePositionLinkButton`) now shares the map centre right away: the link is visible as soon as the tool opens and follows the map until the user clicks the map (or presses Space/Enter with keyboard drawing) to mark a place. Another click moves the marked place, and “Remove marker” returns to sharing the centre, so the separate “Share map centre” button is gone. The link has a visible label (“Link to the map centre” / “Link to the marked place”, new optional `label` on `LinkShare`), the keyboard help stays last, and marking a place no longer selects the marker, so its feature details do not open over the tool.
- 8f0f4b2: UI chrome icons can follow the host theme. Set `$ms3-future-v8-themedIcons: true` with the other `@mapsight/ui` Sass variables to paint the `mapsight-ui/*.svg` icons (map controls, list filter buttons, layer switcher checkboxes, search, close buttons, feature links, place actions, loading/error status) as CSS masks filled from `var(--ms3-icon-color, var(--ms3-theme-color-a))`, with `--ms3-icon-color-active`, `--ms3-icon-color-error` (falling back to `--ms3-theme-color-b`) and `--ms3-icon-color-muted` for states. Overriding the `--ms3-*` colours at runtime now recolours the icons, and forced-colors mode uses system colours. The default stays unchanged: without the flag the compiled CSS is identical to before.

    When you opt in: icon files from a custom `$ms3-iconPath` supply only the shape; icons must be same-origin, `data:` URIs or served with CORS headers; host overrides must set `mask-image` instead of `background-image` (several controls now draw the icon on `::before`/`::after`); and host panels that overlap Mapsight controls need `z-index: 1` or more. The red icons change from `#cc100c` to `--ms3-theme-color-b` (`#cc0000`) and the print icon from `#207ab6` to the theme blue. See [Themed chrome icons](https://github.com/open-mapsight/mapsight/blob/main/packages/ui/README.md#themed-chrome-icons-ms3-future-v8-themedicons). The flag becomes the only behaviour in v8.

- 4803ecf: UI surfaces can follow a dark host theme. Set `$ms3-future-v8-themedSurfaces: true` with the other `@mapsight/ui` Sass variables to take the colours that were fixed to light values from the `--ms3-*` tokens: the `.ms3-wrapper` background (`--ms3-page-background-color`), the attribution box, tool overlay, mini legend, link share field, button and icon, list search input, search reset circle, disabled pagination text, marked point coordinates, map point menu border, and the translucent map controls on narrow screens (new optional `--ms3-map-control-background-color`, default `--ms3-background-color` at 90 % opacity). `.ms3-wrapper` follows the page's `color-scheme` unless the host sets the new optional `--ms3-color-scheme`, and buttons, inputs and selects without their own colour inherit the text colour instead of the browser default. The default stays unchanged: without the flag the compiled CSS is identical to before.

    When you opt in: hosts that already set `--ms3-background-color` or `--ms3-page-background-color` to a non-white value see it on these surfaces; form controls that Mapsight does not colour take the inherited text colour instead of `buttontext`/`fieldtext`; and in the default theme four near-duplicate greys change slightly (link share field `#444` on `#f5f5f5` to `#222` on `#f2f2f2`, disabled page and coordinates `#555`/`#5c5c5c` to `#636567`, search reset circle `#eee` to `#f2f2f2`). Dark themes also need a light text colour on the page, or on the wrapper and portaled surfaces, and should set `--ms3-place-actions-fg`, `--ms3-outbound-fg`, `--ms3-focus-ring-color` and `--ms3-attributions-background-color`. See [Themed surfaces and dark host themes](https://github.com/open-mapsight/mapsight/blob/main/packages/ui/README.md#themed-surfaces-and-dark-host-themes-ms3-future-v8-themedsurfaces). The flag becomes the only behaviour in v8.

    The KERN citizen-service scenario enables both themed surfaces and themed icons, replacing its temporary dark-mode overrides with the product flags.

- 69fc674: Add opt-in skip links: with `uiState.skipLinks: true` the instance starts with “Skip to the map / list / search” links, each only when its target is present and visible, shown only on keyboard focus. They render after hydration, so server markup is unchanged. Default `false`; planned to default to `true` in v8.

### Patch Changes

- c1627bd: Keep popovers connected to their visible title when opened after an initially closed render.
  Include nested fill and stroke constructors for compiled text and regular-shape styles.
  Replace compiler source snapshots and mocked popover checks with executable behavior tests.
- 2f975c0: Keep library builds cached after test-only edits and reuse incremental Core/UI typechecks during local development.
- a27f576: PointInputControls confirm with Enter or Space and wait for a running pan to end, so the point lands under the crosshair. The status updates once the map stops moving and reports confirmation while the stored point is at the centre. The source projection is derived from the editor, and a `crs` is only written for non-geographic sources or to keep an existing one accurate.

    Keyboard measure and share-position drawing also wait for a running pan. Every keyboard crosshair follows view padding and only appears with the map's keyboard focus indicator (`:focus-visible`), not after a pointer click. The measure and share overlays keep their instructions to one sentence and list the keys in a collapsed “Keyboard controls” disclosure (react-aria-components `Disclosure`, styleable via `[data-expanded]`/`[data-focus-visible]`). While a keyboard tool is open, a “Skip to the map” link in its overlay and a “Back to …” link right after the map connect the two without trapping focus; both appear only on keyboard focus (`.ms3-skip-link`). Tool actions use the shared 3 px focus ring. The measure overlay shows a labelled “Distance” output above the keyboard help, live while drawing; “Done” only appears while measuring and stays `aria-disabled` (focusable, announced as unavailable) until there are two points. Native keyboard pan/zoom only read the motion preference for key events, and in-flight reduced-motion handling falls back to execution-time behaviour if OpenLayers' internal animation queue changes.

- Updated dependencies [`2f975c0`, `a27f576`]:
    - `@mapsight/core@14.6.6 → 14.6.7` (patch)
    - `@mapsight/lib-js@3.0.10 → 3.0.11` (patch)
    - `@mapsight/lib-ol@4.3.1 → 4.3.2` (patch)
    - `@mapsight/lib-redux@2.2.4 → 2.2.5` (patch)

## 7.9.2

### Patch Changes

- cbb3c68: Make the map's keyboard focus ring actually visible. The inset outline on `.ms3-map-target` was painted underneath OpenLayers' positioned canvas layers, so focusing the map showed no indicator. The ring is now drawn on a pseudo-element above the map layers, with a white inner ring for contrast on any tiles; `--ms3-focus-ring-color` still sets its colour and forced-colors mode keeps the outline.

## 7.9.1

### Patch Changes

- f24906e: Give the point-input keyboard-help dialog an accessible name matching its visible heading.
- 3f526a7: Formless host-form search (`uiState.searchRenderForm: false` or `renderForm={false}`) no longer starts an extra request on Enter or the search button; like form mode, it only prevents submitting the host form and leaves the search to the debounced query. Document the mode in [Search inside a host form](https://github.com/open-mapsight/mapsight/blob/main/packages/ui/docs/SEARCH_IN_HOST_FORMS.md).
- Updated dependencies [`86c0fe8`]:
    - `@mapsight/core@14.6.5 → 14.6.6` (patch)

## 7.9.0

### Minor Changes

- c823f15: Respect reduced motion in core map transitions, feature fits, keyboard pan/zoom, and UI scrolling. Add opt-in PointInputControls with a focused-map keyboard path and explicit confirmation through the editor's point source.

    Preserve point source CRS and collection metadata, retain original fit destinations and exactly-once OL callbacks across motion changes, and finish concurrent/keyboard transitions without cancelling unrelated work. Allow SSR-safe address search inside host forms with `uiState.searchRenderForm: false`.

- 8ce5ee0: Allow feature details to omit their landmark inside a named sheet via `landmark={false}`, remove nested banner semantics, avoid empty page headings, keep collapsed scroll regions out of the tab order, and preserve layer-switcher hover/focus contrast. Give station and date inputs accessible names and a visible keyboard focus indicator on station selection.

    Support config/target navigation timeouts in accessibility audits, correct fixed-position visibility checks, and return a nonzero exit code for incomplete runs or invalid baseline gates.

### Patch Changes

- 4e0a815: Add the Mapsight brand header to the package README so it shows on the npm package page.
- 133cf96: Bump dependencies from Dependabot ([#396](https://github.com/open-mapsight/mapsight/pull/396)):

    - `@tanstack/react-query` `^5.104.2` → `^5.104.5` (patch)

- f96b0e4: Bump dependencies from Dependabot ([#398](https://github.com/open-mapsight/mapsight/pull/398)):

    - `chokidar` `^5.0.0` → `^6.0.0` (major)

- 926e08f: Keep feature-list selection buttons from advertising inline disclosures when their action navigates to the map, including mobile round tours with `detailsInList`. Close actual inline details on scoped Escape and return focus to the row button, respecting nested dialogs and handled events.
- 017e11c: Give the list sorting select a minimum 24 px height, remove the unused hidden place-action permalink, and separate collapsible layer group labels from their counts so visible text matches accessible names.
- Updated dependencies [`4e0a815`, `7a399a1`, `f96b0e4`, `c823f15`]:
    - `@mapsight/core@14.6.4 → 14.6.5` (patch)
    - `@mapsight/lib-ol@4.3.0 → 4.3.1` (patch)
    - `@mapsight/traffic-style@5.5.3 → 5.5.4` (patch)

## 7.8.0

### Minor Changes

- 0143205: Add an opt-in renderer commit callback so asynchronous host renderers can defer afterRender plugins until React commits. Use the contract in the default browser renderer and Instance, and pin React-Redux hydration to the initial serverState snapshot.

    Keep initial UI markup deterministic across browser capabilities, dialog portals, bottom-sheet sizing, icon caches, locale defaults and serialized dates. Hosts using asynchronous custom renderers should call props.deferCommit() before scheduling React and pass its callback to AppContext.onCommit; implicit UI language now defaults to de on both server and client.

- 2081daa: Name and describe the map surface for assistive technology. `.ms3-map-target` is a region with a translated role description and an accessible name (`mapTitle` prop, default "Interaktive Karte"; hosts may also pass `aria-label` or `aria-labelledby`). With keyboard control enabled, the map references its keyboard help (`ui.map.usage.html`, now including Shift+F10) via `aria-describedby`; the help renders as a visually hidden sibling of `.ms3-map-target`. The map target gets a visible `:focus-visible` ring.
- 6dfb922: Improve accessibility of search, switchers, translations and control tooltips.

    Search now announces debounced loading, result counts and errors in a separate polite status. Pass `announceResults={false}` to `Search` when the host supplies announcements. After selecting a result, focus moves to visible details or the selected list row, falling back to the search input with a selection announcement. `onResultSelected(feature)` runs after rendering so hosts can move focus themselves. The shared `QueryInput` now exposes its input ref on initial mount.

    Base-map radio groups keep the checked radio enabled, use one Tab stop, and move focus and selection with arrow keys. Re-selecting the checked map does nothing. Radio names contain only the layer title. Collapsible group toggle names include their complete visible label and count.

    Layer and tag switchers accept `headlineAs` (default `h3`); split layer switchers also accept `groupHeadlineAs` (default `h4`). Search accepts `groupHeadlineAs` (default `h4`). Hosts can choose a suitable heading level or `div` for non-structural control labels. Existing heading defaults are retained.

    Regional locales such as `en-GB` fall back to their base language while exact host translations still take precedence. Add missing shared labels and search messages, and verify literal translation-key coverage in German and English.

    The ARIA control tooltip (opt-in via `future.v8_ariaControlTooltip`) no longer makes group containers such as the region list an extra Tab stop.

- fc68480: Make collapsed selection details inert, name the details region, and restore focus to the originating list row on close. Keep non-modal details focus trapping opt-in with `featureSelectionInfo.trapFocus` or the component prop.

    Scope tool and sheet Escape handling and respect nested dialogs and handled events. BottomSheet adds `dismissOnEscape` (default `"within"`), opt-in `initialFocus` and `restoreFocus`, translated resize and snap labels, and a heading outside the separator that names the region. Hosts should review title/handle styling and opt into focus movement after user actions.

- a02ab12: Add opt-in automatic native heading hierarchy with `future.v8_automaticHeadings`, instance-scoped
  `headings.baseLevel` and slot overrides, and public heading helpers for composed hosts. Preserve historical
  7.x heading elements without the flag. Support contextual feature-list groups via `renderGroupAs: "auto"`,
  local modal heading scopes, and page-relative non-modal panels and sheets.
- cd3cdf9: Add opt-in keyboard drawing for distance measurement and position sharing. Pass `keyboardDrawing: true` to the measure-distance and share-position-link plugins (default `false`, so existing hosts keep pointer-only drawing). While a tool is active and the map has focus, Enter or Space adds a point at the map centre (marked with a crosshair), arrow keys pan, Backspace removes the last point, and Enter finishes a measurement after two points. The tool overlays then offer "Done" (measurement) and "Share map centre" (position sharing).

    Independently of the option, the measured distance is announced, and a keyboard-opened point menu (Shift+F10) opens at the current map centre instead of the last pointer position.

### Patch Changes

- 8f88cd5: Make feature-list rows reachable by keyboard in every configuration with a single Tab stop and ArrowUp/Down and Home/End navigation, including link-only and highlight-only rows. Render semantic lists, expose selection and inline expansion states to assistive technology, and allow Enter and Space to toggle selection consistently.
- 65abc99: Label list sorting and options dialogs, provide translated semantic pagination, and announce filtering, page changes, and cycling positions accessibly. The `react-paginate` dependency is dropped.
- 743286d: Improve accessibility of map overlay controls. Region buttons expose the selected region with `aria-pressed`. The visually hidden place-actions permalink leaves the Tab order. Geolocation progress and errors and copy results (link, coordinates, failures) are announced. The Mapsight logo no longer looks interactive (no pointer cursor or hover change). The mobile view toggle is 44×44 px and overlay buttons keep a 24 px minimum width. Attribution text keeps an opaque backing and explicit text colour when hosts supply a translucent background token.
- 23fd018: Migrate the remaining UI JavaScript modules and JSX components to TypeScript, with explicit component props, refs, events, Redux state, and middleware types. Keep existing package import paths and runtime behavior, and disable JavaScript compilation in the UI TypeScript project.

## 7.7.0

### Minor Changes

- 37259f5: Make the show-on-map zoom limit configurable: `showOnMap: {maxZoom}` in the place actions config takes a zoom or a function of the feature (default 17), so hosts can fit small areas closer than points

### Patch Changes

- dd49f24: Bump dependencies from Dependabot ([#367](https://github.com/open-mapsight/mapsight/pull/367)):

    - `@tanstack/react-query` `^5.104.1` → `^5.104.2` (patch)
    - `react-aria` `^3.52.1` → `^3.53.1` (minor)
    - `react-aria-components` `^1.21.1` → `^1.22.1` (minor)

- Updated dependencies [`79652e1`, `96cb6b4`]:
    - `@mapsight/core@14.6.3 → 14.6.4` (patch)
    - `@mapsight/lib-ol@4.2.6 → 4.3.0` (minor)

## 7.6.3

### Patch Changes

- d35cc9f: Handle unavailable map targets and viewports in cursor updates and map context menus with OpenLayers 10.11.
- 5980a66: Bump dependencies from Dependabot ([#316](https://github.com/open-mapsight/mapsight/pull/316)):

    - `@tanstack/react-query` `^5.102.4` → `^5.103.2` (minor)

- d35cc9f: Bump dependencies from Dependabot ([#364](https://github.com/open-mapsight/mapsight/pull/364)):

    - `@tanstack/react-query` `^5.103.2` → `^5.104.1` (minor)

- 5dba09f: Tolerate malformed query parameters and throwing plugins. `getQueryStringParameter` now decodes with `decodeURIComponent` and returns the raw value when it is not valid percent-encoding instead of throwing `URIError`. Encoded reserved characters such as `%2F`, `%26`, and `%3D` are now decoded too (previously returned verbatim). A plugin phase that throws synchronously no longer skips later plugins or escapes `render()`; the error is logged with the plugin name and `renderAsync()` still rejects with it.
- c46c174: Add homepage and repository.directory metadata for npm package pages.
- 58a9796: Update the shared Redux Toolkit dependency range from ^2.11.2 to ^2.13.0.
- fe64ff0: Give layer switcher and filter toggle controls meaningful accessible names: split-mode switcher checkboxes now include the layer title with their state, the status icon is exposed as a labelled image, and filter toggle buttons are named after their purpose instead of a generic open/close.
- 03c85eb: Announce async loading, refreshing and empty states reliably: `AsyncStatusRegion` now keeps a persistent `role="status"` live region mounted across phases, errors are consistently exposed as assertive alerts, and `aria-busy` no longer wraps the live region. The share-link URL field also gets an accessible label.
- 72fce5c: Correct swapped English zoom button labels and German next/previous entry labels, and fix the "chosen" typo in the English share-link text.
- d45d9eb: Add keyboard and ARIA support to the measure-distance and share-position tool overlays: the overlay is a region labelled by its heading and closes on Escape, and the toggle buttons expose `aria-expanded` / `aria-controls` and get focus back when the overlay closes.
- af0c6ca: Cache layer-switcher selector factories so connect ownProps stay referentially stable
- fbbba81: Treat HTTP error responses as failures in `fetchText` / `fetchJson`, so 404 or 502 error pages no longer render as feature details. Network errors now dispatch a single failure carrying the original error.
- 8b718fc: Restore visible `:focus-visible` rings on list toggle, filter, and layer-switcher controls
- e178744: Keep the layer switcher within the modal width and wrap long layer titles
- 758699b: Memoize feature-list selectors so list UI does not re-render on unrelated store updates
- 1f37dea: Only resolve feature permalinks to `http:`, `https:`, or relative URLs. Unsafe `permanentLink` properties fall back to the location-based permalink, and unsafe `permalink` config results resolve to no permalink.
- bd95839: Respect prefers-reduced-motion for UI animations and transitions
- Updated dependencies [`45aaead`, `e74d2c8`, `d35cc9f`, `86feccf`, `5980a66`, `63cf309`, `5dba09f`, `6e1146e`, `7dd3752`, `c46c174`, `58a9796`]:
    - `@mapsight/core@14.6.2 → 14.6.3` (patch)
    - `@mapsight/lib-js@3.0.9 → 3.0.10` (patch)
    - `@mapsight/lib-ol@4.2.5 → 4.2.6` (patch)
    - `@mapsight/traffic-style@5.5.2 → 5.5.3` (patch)
    - `@mapsight/lib-redux@2.2.3 → 2.2.4` (patch)

## 7.6.2

### Patch Changes

- 093b3f0: Bump production dependencies from Dependabot ([#304](https://github.com/open-mapsight/mapsight/pull/304)):

    - `react-aria` `^3.52.0` → `^3.52.1` (patch)
    - `react-aria-components` `^1.21.0` → `^1.21.1` (patch)
    - `postcss` `^8.5.26` → `^8.5.28` (patch)
    - `sass` `^1.103.1` → `^1.104.0` (minor)
    - `@types/react-dom` `^19.2.5` → `~19.2.7` (patch)
    - `@playwright/test` `^1.62.1` → `^1.63.0` (minor)
    - `playwright` `^1.62.1` → `^1.63.0` (minor)

- Updated dependencies [`65e2528`]:
    - `@mapsight/core@14.6.1 → 14.6.2` (patch)
    - `@mapsight/lib-js@3.0.8 → 3.0.9` (patch)
    - `@mapsight/lib-ol@4.2.4 → 4.2.5` (patch)
    - `@mapsight/lib-redux@2.2.2 → 2.2.3` (patch)

## 7.6.1

### Patch Changes

- 4ebee20: Show the feature-list pagination control again when `paginationControl` is on, including under Vite's CJS interop for `react-paginate`

## 7.6.0

### Minor Changes

- e08f7c3: Add a map context menu that marks one shared point, copies coordinates, and opens directions

### Patch Changes

- 2ce2629: Add an opt-in FeatureSourceCache seam so xhr-json loads can reuse a process-memory (or later IDB) document cache keyed by URL and revision
- 99f002d: Bump dependencies from Dependabot ([#240](https://github.com/open-mapsight/mapsight/pull/240)):

    - `@tanstack/react-query` `^5.101.4` → `^5.102.4` (minor)
    - `svgo` `^4.0.2` → `^4.1.0` (minor)

- 2674b27: Bump dependencies from Dependabot ([#260](https://github.com/open-mapsight/mapsight/pull/260)):

    - `react-aria` `^3.51.0` → `^3.52.0` (minor)
    - `react-intersection-observer` `^11.0.0` → `^11.0.1` (patch)

- 2674b27: Bump dependencies from Dependabot ([#261](https://github.com/open-mapsight/mapsight/pull/261)):

    - `@testing-library/react` `^16.3.2` → `^16.3.3` (patch)

- d45568d: Remount feature-details metric widgets after a source XHR refresh so charts do not stay empty
- 43650f5: Apply Place and module page meta to the live document head after client route changes
- 0ac9dc5: Deprecate hint.css control tooltips behind future.v8_ariaControlTooltip
- b86fef3: Replace combined feature-source members instead of merging
- 4ffedd1: Compose Mapsight UI icons as SVG on first paint, including compact 1–2 character labels
- 696fbe4: Focus an autofocus field after opening a native dialog, instead of the first tabbable control
- 691da32: Isolate render exceptions in list, details, and overlay regions so one failing component no longer unmounts the whole UI
- 85af82f: Add CreateOptions.future flags for next-major behavior
- d04c5e0: Move generic feature permalink, geo, nearest-address, and document-adjacent helpers off place-actions and plugin folders
- 90ea3c9: Allow layer-switcher entries to render optional host content after the title
- 95b10f7: Keep list distances off the panel edge
- cd691ac: Opt into collapsed list search with future.v8_listSearchButton
- 26ea30d: Use a sliders icon for list filter and sort
- d45d5be: Keep the map slot inside its flex row in every view so a wide map-slot child cannot overflow fullscreen
- e08f7c3: Let custom navigation targets supply an origin URL for the map-point “from here” menu
- 2bbb899: Sort FeatureList group headers by a leading number so numbered sections keep a
  fixed order after distance sort
- 9ba015e: Trap keyboard focus in fullscreen and map-only chrome so host-page controls stay unreachable
- 13c7a7a: Keep react-aria overlay portals clickable while fullscreen and map-only chrome is open
- 0cdb4a1: Add a reusable hover/focus tooltip for controls
- d851d54: Add share/route/show-on-map place actions as icon-only buttons with tooltips; keep NUNAV out of the default routing list
- 85ad6ef: Add headless place actions (share, navigate, website, call) and an optional details slot for them
- e6384ba: Add a generic text-only Place Open Graph card for hosts to render with Satori
- 9602d5a: Add a generic page-meta utility and keep the selected-feature builder and OG card on their own entries
- 51c4d1b: Add a pure place page-meta builder for selected-feature title, Open Graph, and Place JSON-LD
- a717fb7: Reveal a place's owning layer on `?feature=` deep links, and add `?src=` only when that catalog source is not already implied
- fc2abea: Allow hosts to set z-index on share-position and measure-distance draw layers.
- Updated dependencies [`2ce2629`, `0a24a14`, `35b1990`, `587c6ff`, `d0e3c5c`, `99f002d`, `6a3871f`, `2674b27`, `0968fcd`, `d2e7d5f`, `4ffedd1`, `a717fb7`]:
    - `@mapsight/core@14.6.0 → 14.6.1` (patch)
    - `@mapsight/lib-ol@4.2.3 → 4.2.4` (patch)
    - `@mapsight/traffic-style@5.5.0 → 5.5.1` (patch)

## 7.5.0

### Minor Changes

- e2ce340: Add `BottomSheet` with snap points and an accessible resize separator
- b5c43bb: Emit `--ms3-*` design tokens from configured Sass variables (mixin + `$ms3-tokens-selector`), use them for easy color/size/z-index values, and add minimal scrollbar utilities
- 676a9fe: Add `FeatureListOptionsPopover` with list options controller hook, i18n labels, and structural list-options SCSS (theme chrome in 2022-03)
- 08f8e3f: Add collapsible layer-switcher groups with visible/total counts and optional base-layer preview thumbnails
- 1153f61: Add `useMapViewportSyncForBottomSheet` for map resize/recenter and selection dismiss with in-flow bottom sheets
- e2ce340: Add `useNativeDialog` and `NativeDialog` for controlled native `<dialog showModal>` drawers
- e2ce340: Add `usePopoverDialog` and `PopoverDialog` for non-modal positioned dialog popovers
- a6a21d5: Add `nodeEmbed.emitFragment` / `getDehydratedState` and fix the SSR server-handler to return an HTML embed fragment with `data-dehydrated-state`

### Patch Changes

- 8666339: Bump dependencies from Dependabot updates and security overrides.
- 1153f61: Add structural BottomSheet SCSS for `ms3-bottom-sheet` layout states
- 3fb5686: Size mapOnly/fullscreen chrome with `svh` so iOS browser chrome is excluded from the viewport height
- b443c6e: Keep exactly one split-switcher base layer selected by disabling the active button
- aa41f30: Add missing German and English strings for collapsible layer-switcher groups
- 71791b4: Keep AppWrapper className when spreading attributes, show list-item details only for expandInList, and remove feature-selection close-button debug logs
- 7be56da: Keep feature-list `listInformation` HTML mounted across highlight selection changes so CMS contact pictures do not remount and flicker on hover.
- b267418: Export `registerTranslations` so hosts can merge catalogs into the shared UI dictionary
- a6a21d5: Clear in-flight loading flags on SSR dehydrate/rehydrate, and let the server feature deep-link select `?feature=` (including mapOnly on mobile).
- a6a21d5: Include list/details render-await plugins in default server plugins so `renderAsync` can delay SSR until feature data is loaded
- 3f4ba18: Add remount-safe `useOlSingleClick` option to the toggle-mobile-views plugin
- Updated dependencies [`bd11b3b`, `8666339`, `9eb9ff8`, `e99fbdb`, `08f8e3f`]:
    - `@mapsight/core@14.5.1 → 14.6.0` (minor)
    - `@mapsight/lib-js@3.0.7 → 3.0.8` (patch)
    - `@mapsight/lib-ol@4.2.2 → 4.2.3` (patch)
    - `@mapsight/traffic-style@5.4.0 → 5.5.0` (minor)

## 7.4.2

### Patch Changes

- 2196e08: Fix `@typescript-eslint/unbound-method` lint errors surfaced by typescript-eslint 8.65.
- Updated dependencies [`2196e08`]:
    - `@mapsight/core@14.5.0 → 14.5.1` (patch)

## 7.4.1

### Patch Changes

- 553337a: Fix FeatureList `itemAs` wrapper behaviour and `getPath` defaultValue so host list items (overrideListHtml) render again. Document the host contract and add regression tests.
- 8fe2421: Restore `.ms3-map-overlay-combined-buttons__button` wrappers around CombinedButtons children so host CSS can share a single 1px edge between zoom +/- (and similar stacked overlay controls).
- dcd6ae1: Remember document scroll at list-item pointerdown so mapOnly selection restores the pre-click list position.
- dcd6ae1: Restore select/deselect interaction props on FeatureListItem when `overrideListHtml` short-circuits past FeatureSelectButton, and migrate FeatureSelectButton / useSelectFeature to TypeScript.
- Updated dependencies [`553337a`]:
    - `@mapsight/lib-js@3.0.6 → 3.0.7` (patch)

## 7.4.0

### Minor Changes

- c58c407: Restore legacy embed bag helpers and host entry aliases (createEmbedBag, default plugins / hook sugar, filterFeatures, withKeyboard, global-event-hub, is-numeric) so pre-OSS CMS hosts can migrate with smaller diffs.
- 1710d90: Restore additional pre-OSS host runtime compatibility (controller `globalState` reduce arg, layout slot wiring, presentational list toggle, style-env merge) and mark those legacy surfaces `@deprecated` for removal in the next major of each package.

### Patch Changes

- 65ce23a: Isolate FeatureList selection/highlight updates so only affected list items re-render
- Updated dependencies [`d0334aa`, `3539440`, `cb180eb`, `0b2f8a8`, `c58c407`, `1710d90`]:
    - `@mapsight/traffic-style@5.3.2 → 5.4.0` (minor)
    - `@mapsight/core@14.4.2 → 14.5.0` (minor)
    - `@mapsight/lib-ol@4.2.1 → 4.2.2` (patch)
    - `@mapsight/lib-js@3.0.5 → 3.0.6` (patch)

## 7.3.2

### Patch Changes

- 01bb11d: Declare MIT license in package manifests.
- Updated dependencies [01bb11d]
    - @mapsight/core@14.4.2
    - @mapsight/lib-js@3.0.5
    - @mapsight/lib-ol@4.2.1
    - @mapsight/lib-redux@2.2.2
    - @mapsight/traffic-style@5.3.2

## 7.3.1

### Patch Changes

- 68d687a: Stop xhr-json feature source autoload loops on HTTP errors with empty status text (for example 404 during partial deploys).
- Updated dependencies [1631abc]
- Updated dependencies [68d687a]
    - @mapsight/traffic-style@5.3.1
    - @mapsight/core@14.4.1

## 7.3.0

### Minor Changes

- 5743b4a: Add async status components and feature list loading/error/empty states. Export `@mapsight/ui/async-status`.
- 5743b4a: Add TanStack Query adapter subpath, migrate search results and feature details loading UI to shared async status components.
- b7d0ece: Add optional geolocation distance labels for feature list items. Export `DistanceLabel`, wire via `itemDistanceLabelAs` / `distanceLabelAs` (default off), and style opted-in rows with `ms3-list__main--with-distance` in the 2022-03 theme.
- 0acda06: Add optional `listDefaultSortingByFeatureSource` UI state and `effectiveListSortingSelector` for per-feature-source default list sorting. Existing apps keep current behavior until they configure defaults; explicit user sorting still wins.
- b755930: Add optional search icon styling for `QueryInputWithLabel` via `$ms3-option-queryInputWithLabelSearchIcon` (default `false`). Styles live in the block partial and are omitted at compile time when the option is off.

### Patch Changes

- 5743b4a: Export async status components subpath and migrate count-aggregator-ui loading states to shared QueryStatusRegion and AsyncStatusRegion.
- 7d48f25: Bump dependencies from Dependabot ([#96](https://github.com/open-mapsight/mapsight/pull/96)).
- f16212e: TypeScript: migrate the feature-list-item cluster (`index`, `head`, scroll hook) and add shared list-item handler types.
- b919f0b: Skip desktop overlay dismiss handling when the layer switcher is shown in the mobile modal.
- ee1ed8c: Export the shared i18n helper entrypoint for apps.
- Updated dependencies [b8b31e2]
- Updated dependencies [8cf6b58]
- Updated dependencies [dd17aa3]
- Updated dependencies [7d48f25]
- Updated dependencies [7296703]
- Updated dependencies [9fa5b74]
- Updated dependencies [38f03ad]
    - @mapsight/core@14.4.0
    - @mapsight/lib-ol@4.2.0
    - @mapsight/traffic-style@5.3.0

## 7.2.1

### Patch Changes

- 25c5f29: Stop initializing runtime-only feature source state in UI feature source config
  helpers.

    The helpers now return only feature source configuration fields and rely on the
    core runtime state normalization introduced in
    https://github.com/open-mapsight/mapsight/commit/6cd6e11ffe73633eeb55f8e02425748baefe385d
    to populate `data`, `lastUpdate`, and `lastActionType`.

- 25c5f29: Add more flexible layer switcher presentation options.

    Layer switchers can now render base layers in their own section while keeping
    overlay layers grouped separately, with base layer entries isolated from feature
    source updates. Feature lists can also render the external layer switcher behind
    a compact filter-toggle control.

    The default layer switcher CSS stays intentionally minimal; the richer split
    layout sizing, spacing, and expanded overlay dimensions live in the existing
    `2022-03` theme.

- Updated dependencies [6cd6e11]
- Updated dependencies [77faf3d]
    - @mapsight/core@14.3.0
    - @mapsight/traffic-style@5.2.0

## 7.2.0

### Minor Changes

- 49da00b: Add combined feature sources that merge features from multiple member sources, and a `combinedVisibleLayers` plugin that keeps a combined source in sync with whichever member map layers are currently visible.
- 49da00b: Add composable runtime icons: pictogram-based templates and `mapsightIconId` parsing in traffic-style (with configurable default xsmall/small icon zoom levels), async rasterization with volatile style-cache invalidation in lib-ol and vector-style-compiler, plus `useMapsightIcon` and a runtime icon style plugin in ui.
- 49da00b: Add Zod-based Mapsight config validation: core exports `createMapsightConfigSchema`, `validateConfig`, and per-domain schemas for map, layers, feature sources, and filters; ui validates config on startup (warn in development, optional strict mode in production).
- 49da00b: Migrate to Redux Toolkit 2, Redux 5, react-redux 9, and reselect 5; replace `createStructuredSelector` usage, prefer `@reduxjs/toolkit` exports, and update the vector-editor browser renderer to React 18 `createRoot`.
- 8d3ccfc: Add `getGeoJsonFeatureSortAnchor` in lib-ol and use it for distance sorting in the feature list. TypeScriptify list components, add tag-switcher and filter toggle controls, extract `MapsightIcon`, and fix a feature-source autoload loop.

    ***

### Patch Changes

- 49da00b: Add `@mapsight/ui/embed/*` package exports for embed entry points.
- e5c52ea: Resolve map sprite and theme icon paths from style env `imagesUrl` instead of baking `/img/` at compile time. Traffic-style sprite rules use `attr(--env-imagesUrl)` with a new `$MAPSIGHT_TRAFFIC_STYLE__SPRITE_FILE` variable; MapController gains `setDefaultStyleEnv()`; ui wires `createOptions.imagesUrl` into that default env so CMS embeds can set the icon base per deploy path without rebuilding JS.
- 74568cf: Improve traffic-style icon pipeline: add Font Awesome smart-city pictograms and default ort icons, fix sprite padding and missing default build output, unify sprite/runtime icon fallback in SCSS mixins, and resolve Sass deprecation warnings.

    ***

- 1e0651c: Publish `src/scss` in the npm tarball so integrators can `@use` Mapsight UI SCSS entry points (host starters, Next/SPA shells) after `npm install`.
- Updated internal dependencies.

## 7.1.0

### Minor Changes

- 5eede53: Prepare to move to redux toolkit, cleanup types, cleanup code

### Patch Changes

- Updated dependencies [5eede53]
    - @mapsight/lib-redux@2.1.0
    - @mapsight/core@14.1.0

## 7.0.3

### Patch Changes

- 744e584: Full release of all packages (now with github releases too?)
- Updated dependencies [744e584]
    - @mapsight/lib-redux@2.0.3
    - @mapsight/lib-js@3.0.3
    - @mapsight/lib-ol@4.0.3
    - @mapsight/core@14.0.3

## 7.0.2

### Patch Changes

- d4ec483: Full release with CI (try 2)
- Updated dependencies [d4ec483]
    - @mapsight/core@14.0.2
    - @mapsight/lib-js@3.0.2
    - @mapsight/lib-ol@4.0.2
    - @mapsight/lib-redux@2.0.2

## 7.0.1

### Patch Changes

- fdd3c3a: Full release of all packages via CI
- Updated dependencies [fdd3c3a]
    - @mapsight/core@14.0.1
    - @mapsight/lib-js@3.0.1
    - @mapsight/lib-ol@4.0.1
    - @mapsight/lib-redux@2.0.1
