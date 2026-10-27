# Code-level accessibility review — `@mapsight/ui` + `@mapsight/core`

Repo: `open-mapsight/mapsight` @ `2384a410`.
Scope: `packages/ui/src` (components, hooks, SCSS) and the map/keyboard setup in `packages/core`.
Method: source reading only (no dependencies installed in the worktree, nothing run in a browser).
Behaviour of third-party libraries (react-paginate 8.3.0, hint.css 3.0.0, focus-trap 8 / focus-trap-react 12)
was checked against the installed package sources.

> Follow-up checks in Chromium against a production host (2026-10-27): CR-UI-003 reproduced (focus
> stays in the collapsed panel after closing; the audit scenario `select-and-close` now catches it).
> CR-UI-005 did not reproduce there: Tab leaves the details panel after its last control. The
> generic findings were also confirmed by running `@mapsight/a11y-audit` on the showcase
> (`apps/showcase/a11y.config.mts`).

## Summary

- **Core map setup is sound.** `WithMap` creates the OL map with `controls: []` and `interactions: []`
  (`packages/core/src/js/lib/map/lib/WithMap.ts:154-158`). Interactions and controls come from state, so no
  OpenLayers default controls (and none of their English titles) are rendered. Attribution is drawn by
  `@mapsight/ui`, not by OL. `KeyboardPan` and `KeyboardZoom` are in the UI default interaction set
  (`packages/ui/src/js/config/map/interactions.ts:11-12`). `keyboardEventTarget` is not set, so OL listens
  on the map target `div`, and `MapsightMap` makes that div focusable (`tabIndex=0`, `map.tsx:39-40`).
  Map overlays render as siblings of the map target, not inside the OL viewport, so key presses in overlay
  widgets don't pan or zoom the map. The only core-level item is reduced motion (CR-CORE-001).
- **The biggest gaps are in the feature list, which is the keyboard and screen-reader alternative to the map canvas.**
    - Rows are hard-coded to `tabIndex=-1`. With the prop's default (`enableKeyboardControl=false`), or for
      rows that are only a permalink, keyboard users can't reach them at all (CR-UI-001).
    - The select control doesn't expose a selected or expanded state (CR-UI-002).
    - After the selection-info panel is closed, it stays mounted with its focus trap still active inside a
      0 px wide panel (CR-UI-003).
- **Map tools:** measuring a distance and sharing a position only work with a pointer (CR-UI-004). The open
  tool also captures _every_ Escape press on the page (CR-UI-006). The keyboard-opened context menu reuses
  a stale point (CR-UI-007).
- **Status messages (4.1.3) are mostly missing.** Nothing announces search hit counts, list filtering, page
  changes, measurement results, geolocation errors or copy failures (CR-UI-009). Only the point context
  menu and the fullscreen wrapper use `announceStatus`.
- **Primitives:** `BottomSheet` puts its `h2` inside `role="separator"` (presentational children) and
  defaults to the English name "Resize" (CR-UI-011). The base-layer radiogroup disables the checked radio
  (CR-UI-010). A focusable `ms3-visuallyhidden` permalink is an invisible Tab stop (CR-UI-013).
- **Probably already caught by the automated run, so not detailed here:**
    - `FeatureListContent` renders `<li>` items inside a `div` container (`feature-list/content.jsx:11` uses
      `as = "div"`, while `index.tsx:198` picks `li`), which axe reports as `listitem`.
    - The focusable list container and the map target have no role or name, which the Tab walk reports.

Findings: 19 (1 critical, 3 serious, 11 moderate, 4 minor).

---

## Findings

### CR-UI-001

- id: CR-UI-001
- title: Feature-list rows are taken out of the Tab order. With `enableKeyboardControl` off (the default), or for rows that are only a permalink, keyboard users can't reach them at all.
- location: `packages/ui/src/js/components/feature-list-item/head.tsx:82`, `:102`, `:116`; `packages/ui/src/js/components/feature-list/index.tsx:98`; `packages/ui/src/js/components/feature-list/hooks/useKeyboardNavigation.js:9`, `:50-60`, `:81`
- owner: @mapsight/ui
- wcag: 2.1.1 Keyboard (A)
- impact: critical
- affected users: keyboard, screen reader (Tab/forms mode)
- evidence:
    ```tsx
    // head.tsx:81-83 (select button)          head.tsx:101-104 (permalink-only row)
    <FeatureSelectButton tabIndex={-1} className={`… ms3-list__button …`}
    <a tabIndex={-1} href={permanentLink} className={`${className} [ ms3-list__link ]`}>
    // feature-list/index.tsx:98
    enableKeyboardControl = false,
    // useKeyboardNavigation.js:50-55: when disabled the container gets no tabIndex / onKeyDown
    // useKeyboardNavigation.js:9 / :81: arrow navigation only queries ".ms3-list__button"
    ```
    Rows can only be reached through the arrow-key handler on the container. This fails in three ways:
    - (a) The public `<FeatureList />` defaults `enableKeyboardControl` to false. The container then isn't
      focusable and every row control is `tabIndex=-1`, so there's no keyboard path to a place. The built-in
      `App` passes `true` (`app.tsx:226`, `main-panel/index.tsx:21`), but hosts composing `FeatureList`
      themselves get the default.
    - (b) Permalink-only rows (`selectOnClick`/`deselectOnClick` false, plus `permanentLink`) get the class
      `ms3-list__link`. `moveFocus` never queries that class, so these rows can't be reached even with
      keyboard control on.
    - (c) Highlight-only rows (head case 3) are `<span class="ms3-list__button">`. Arrow navigation calls
      `.focus()` on a span that can't take focus, so the arrow keys appear to do nothing.
- reproduce:
    1. Embed `<FeatureList />` without the prop, or use a list config with `selectOnClick: false` and
       features that have `permanentLink`.
    2. Tab through the page. Focus skips from the list header controls past every row.
    3. In case (b), Tab to the list container (keyboard control on) and press ArrowDown. Nothing gets focus.
- fix: Make rows reachable regardless of the arrow-key enhancement:
    - Use a roving tabindex: the current or first row gets `tabIndex=0`, the others `-1`, and the arrow
      keys move focus.
    - Mark navigable rows with a data attribute (e.g. `data-ms3-list-nav`) instead of matching
      `.ms3-list__button`, so links are included.
    - When keyboard control is off, keep native tab order (no `-1`).
    - Default `enableKeyboardControl` to `true`. Reaching the rows shouldn't be opt-in; only the arrow-key
      behaviour should be an option.
- automatable: yes. Playwright: render the list in each `selectOnClick`/permalink config, Tab plus arrow
  keys, and assert that every `.ms3-list__item` head can receive focus. Add a unit test on `head.tsx`
  tabIndex.
- confidence: high

### CR-UI-002

- id: CR-UI-002
- title: The feature-list select control exposes no selected or expanded state. The `<a role="button">` variant ignores Space, and Enter can't deselect.
- location: `packages/ui/src/js/components/feature-select-button.tsx:64-75`, `:84-91`; `packages/ui/src/js/components/feature-list-item/index.tsx:222-238` (state only in `className`)
- owner: @mapsight/ui
- wcag: 4.1.2 Name, Role, Value (A); 1.3.1 Info and Relationships (A); APG Button
- impact: serious
- affected users: screen reader, keyboard
- evidence:
    ```tsx
    const handleKeyDown = (e) => {
    	if (e.key === "Enter") {
    		e.preventDefault();
    		if (selectOnClick && onSelect)
    			onSelect(featureId, {keyboard: true});
    	}
    };
    if (permanentLink)
    	return (
    		<a href={permanentLink} role="button" {...interactiveAttributes} />
    	);
    return <button type="button" {...interactiveAttributes} />; // no aria-pressed / aria-expanded / aria-current
    ```
    - Selection is only expressed through `ms3-list__item--selected`.
    - With `detailsInList`, the button expands details inline, which needs `aria-expanded` and
      `aria-controls`. Otherwise the selection shows in a separate panel, which needs `aria-pressed` or
      `aria-current`.
    - `role="button"` on a real link hides the link semantics (open in new tab).
    - Space on that `<a>` scrolls the page instead of activating it.
    - Click toggles deselection, but Enter always calls `onSelect`, so keyboard users can't deselect with
      Enter.
- reproduce:
    1. With NVDA or VoiceOver, arrow to a row and press Enter. Details open.
    2. Move away and back: the row is announced only as "Schaltfläche", never "gedrückt" or "erweitert".
    3. On a row with a permalink, press Space: the page scrolls and nothing is selected.
- fix:
    - Add `aria-pressed={isSelected}`. When details render inline, use `aria-expanded={isSelected}` plus
      `aria-controls` pointing to the details id instead.
    - Render a real `<button>` (or handle Space on keyup) for permalink rows, and keep the link as a
      separate visible or hidden-on-focus element.
    - Send Enter through the same toggle path as click.
- automatable: partly. Unit tests for the attributes. Playwright: select via keyboard and assert `aria-pressed` or `aria-expanded`.
- confidence: high

### CR-UI-003

- id: CR-UI-003
- title: After a selection is closed, the collapsed main panel keeps the old selection info mounted (0 px wide or high) with its focus trap still active. Keyboard focus is caught in invisible content.
- location: `packages/ui/src/js/components/main-panel/index.tsx:17-31`; `packages/ui/src/js/components/feature-selection-info/index.tsx:58-62`; `packages/ui/src/js/store/selectors.ts:500-504`; `packages/ui/src/scss/blocks/_panel-container.scss:18`, `:36`; `packages/ui/src/scss/blocks/_panel.scss:11`; `packages/ui/src/scss/blocks/_feature-selection-info.scss:92`
- owner: @mapsight/ui
- wcag: 2.4.3 Focus Order (A); 2.4.7 Focus Visible (AA); 2.1.2 No Keyboard Trap (A) — the only exit is Escape, and nothing tells the user that
- impact: serious
- affected users: keyboard, screen reader, low vision
- evidence:
    ```tsx
    // main-panel/index.tsx:17-31 — content is only replaced while contentType is truthy
    if (contentType) {
    	contentRef.current = (
    		<>
    			{" "}
    			<FeatureList enableKeyboardControl={!collapsed} />
    			{isShowingSelectionInfoRef.current && (
    				<FeatureSelectionInfo
    					feature={feature}
    					enableKeyboardControl={!collapsed}
    				/>
    			)}{" "}
    		</>
    	);
    }
    // selectors.ts:500 — collapsed whenever contentType === null (no selection and showList false)
    // feature-selection-info/index.tsx:58 — <FocusTrap active={enableKeyboardControl} …>
    // _panel-container.scss:18 width:0 | _panel.scss:11 overflow:hidden | _feature-selection-info.scss:92 close button opacity:0 in .ms3-panel--empty
    ```
    This happens in the default desktop view (left panel with `showList=false`, because `showListInMapRow`
    is only true in fullscreen, `app.tsx:79-80`) and in the mapOnly view.
    1. Closing the selection sets `contentType` to null, so the panel collapses.
    2. `MainPanel` re-renders the same element object from `contentRef` (old feature,
       `enableKeyboardControl=true`), so React skips re-rendering it.
    3. `FocusTrap`'s `active` prop never changes. focus-trap-react only deactivates when `active` goes from
       true to false or on unmount, and the close-button click happens inside the trap. So the trap stays on.
    4. The panel is clipped to width 0 (or max-height 0) and the close button is set to opacity 0. Focus is
       on an invisible button, and Tab cycles through invisible links.
    5. Escape releases the trap (focus-trap default), but nothing tells the user that.
- reproduce:
    1. Desktop view, list below the map (default). Focus a list row and press Enter. The selection info
       opens next to the map and takes focus.
    2. Tab to the close button and press Enter. The panel animates closed.
    3. Press Tab several times. No focus indicator is visible, and in devtools `document.activeElement`
       stays inside `.ms3-panel--empty` until Escape is pressed.
- fix:
    - When collapsed, render nothing interactive: unmount after the transition, or put `inert` plus
      `aria-hidden` on `.ms3-panel__inner` while `collapsed`.
    - Don't reuse stale elements that contain live widgets. If the slide-out animation is wanted, render a
      non-interactive snapshot.
    - Compute `FocusTrap active` from current props (`enableKeyboardControl && !collapsed`).
    - On close, move focus explicitly to the originating row or the map target.
- automatable: yes. Playwright: select via keyboard, close with the close button, press Tab 5 times, and
  assert that `activeElement` is visible (`getBoundingClientRect().width > 0`) and outside `.ms3-panel--empty`.
- confidence: medium (derived from React's skip on identical elements plus focus-trap-react's update logic; not run in a browser)

### CR-UI-004

- id: CR-UI-004
- title: The measure-distance and share-position tools only work with a pointer. Keyboard users can open the tool but can't place points.
- location: `packages/ui/src/js/plugins/common/measure-distance.ts:84-90`, `:143-156`; `packages/ui/src/js/plugins/browser/share-position-link.ts:170-175`; `packages/ui/src/js/helpers/i18n/de.ts:212`; `packages/ui/src/js/components/map-overlay/measure-distance-button.tsx:155-168`; `packages/ui/src/js/components/map-overlay/share-position-link-button.tsx:121-141`
- owner: @mapsight/ui (the OpenLayers `Draw` interaction has no keyboard support)
- wcag: 2.1.1 Keyboard (A)
- impact: serious (secondary task)
- affected users: keyboard, screen reader, motion
- evidence: `DrawInteraction` with `type: "LineString"` (measure) and `type: "Point"` (share). The instructions are pointer-only ("Klicken Sie auf die Karte um Punkte hinzuzufügen. Ein Doppelklick schließt die Strecke ab." / "Click on the map to share a position."), and neither plugin has a key handler. Measuring point to point doesn't depend on a drawn path, so the 2.1.1 path exception doesn't apply.
- reproduce:
    1. Tab to "Strecke messen" and press Enter. The tool panel opens.
    2. Tab to the map and press Enter, Space, or arrows. No vertex is added.
    3. "Ort teilen" behaves the same way.
- fix:
    - Reuse the crosshair approach from the context menu: while a tool is active and the map target has
      focus, Enter or Space adds a vertex at the view centre (show the crosshair), Backspace removes the
      last vertex, and a "Fertig" button or Enter on the last point finishes.
    - For share position, add a "Kartenmitte teilen" button to the `ToolOverlay`.
    - Make this an option (`keyboardDrawing`, default `true`) and update the instruction strings.
- automatable: partly. Playwright: open the tool by keyboard, focus the map, press Enter twice, and assert the measure feature source has a feature.
- confidence: high

### CR-UI-005

- id: CR-UI-005
- title: The feature-selection info traps Tab focus in a panel that is neither modal nor named. Leaving it requires Escape, which also deselects the place.
- location: `packages/ui/src/js/components/feature-selection-info/index.tsx:58-63`; `packages/ui/src/js/components/feature-selection-info/wrapper.jsx:5-23`, `:34-39`; `packages/ui/src/js/components/feature-selection-info/header.tsx:15`
- owner: @mapsight/ui
- wcag: 2.1.2 No Keyboard Trap (A) — the exit method isn't communicated; 4.1.2 Name, Role, Value (A) — the focused container has no role or name; APG Dialog vs. non-modal region
- impact: moderate
- affected users: keyboard, screen reader
- evidence: `<FocusTrap active={enableKeyboardControl} focusTrapOptions={{clickOutsideDeactivates: true, onDeactivate: removeSelection}}>`.
  On every feature change the wrapper `<div tabIndex={-1}>` receives focus (`wrapper.jsx:20`). It has no
  role and no `aria-labelledby` pointing to the `h3`.
    - The behaviour is asymmetric. Pointer users can keep using the map, search and layers, because a click
      outside releases the trap. Keyboard users can't reach them without closing the place.
    - Screen reader users get no dialog semantics, so they don't know Tab is constrained or that Escape
      closes the panel.
- reproduce:
    1. Desktop view: select a list row with Enter.
    2. Press Tab 20 times. Focus never leaves the selection info.
    3. Press Escape. The panel closes and the selection is lost.
    4. With NVDA, focus lands on an unnamed container (no region or heading name).
- fix: Preferred, since this is an in-flow panel:
    - Remove the trap and make the wrapper `role="region" aria-labelledby={headlineId}`.
    - Move focus to the heading (`tabIndex=-1`), and return focus to the originating row on close.

    Alternatively, make it a real modal (`role="dialog" aria-modal="true"` with a name) and announce the
    Escape hint. Make the trap an opt-in option (`featureSelectionInfo.trapFocus`, default `false`).

- automatable: partly. Playwright: open the selection, press Tab 20 times, and assert that focus leaves the panel. Assert a role and name on the element that receives focus.
- confidence: high

### CR-UI-006

- id: CR-UI-006
- title: An open measure or share tool swallows every Escape press on the page (document capture plus `stopPropagation`), so other widgets can no longer be closed with Escape.
- location: `packages/ui/src/js/components/map-overlay/tool-overlay.tsx:24-33`
- owner: @mapsight/ui
- wcag: 2.1.1 Keyboard (A) (secondary); APG dialog/popover Escape behaviour
- impact: moderate
- affected users: keyboard, screen reader
- evidence:

    ```tsx
    const onKeyDown = (event) => {
    	if (event.key === "Escape") {
    		event.stopPropagation();
    		onClose();
    	}
    };
    document.addEventListener("keydown", onKeyDown, true);
    ```

    The capture listener on `document` runs before React's root listener and before any listener on the
    target, and it stops propagation there. While a tool is open, these Escape handlers never run:
    - search clear (`useHandleEscapeKeyDown`, a native listener on the input)
    - react-aria popovers and menus (list options, map point menu)
    - `BottomSheet`, and the `useOverlayDismiss` users (bubble phase on `document`)

    Instead the tool closes, and `closeAndReset` moves focus to the tool's trigger.

- reproduce:
    1. Open "Strecke messen".
    2. Open the list-options popover, or type in the search field.
    3. Press Escape. The popover stays open (or the search isn't cleared), the measure tool closes, and focus
       jumps to the tool button.
- fix: Handle Escape only when focus is inside the tool overlay, its trigger, or the map target. Check `!event.defaultPrevented`, use the bubble phase, and don't call `stopPropagation` globally. The top-most overlay should win.
- automatable: yes. Playwright: open the tool plus a popover, press Escape, and assert the popover is closed and the tool is still open.
- confidence: high

### CR-UI-007

- id: CR-UI-007
- title: The keyboard-opened map context menu (Shift+F10 or the Menu key) reuses the first point. After panning with the arrow keys it still targets the old coordinates.
- location: `packages/ui/src/js/components/map-overlay/map-point-context-menu.tsx:249-258` (`openAt` stores into `lastPointerRef`), `:389-425` (the keyboard path prefers `lastPointerRef`), `:180-183` (`closeMenu` doesn't reset it), `:269-291` (pointer moves overwrite it)
- owner: @mapsight/ui
- wcag: 2.1.1 Keyboard (A) — the function only works partly from the keyboard
- impact: moderate
- affected users: keyboard, screen reader
- evidence: `openAt` sets `lastPointerRef.current = next`. The keyboard handler does `const last = lastPointerRef.current; if (last) { openAt({...last, showCrosshair: true}); return; }`, so the view centre is only used if no point was ever recorded. If a mouse is present, the menu opens at the last mouse position over the map.
- reproduce:
    1. Tab to the map and press Shift+F10. The menu opens with a crosshair at the centre.
    2. Choose "Koordinaten kopieren", then press Escape.
    3. Pan right with ArrowRight several times and press Shift+F10 again. The crosshair and pin appear at the
       old screen spot, and the copied coordinates are unchanged.
- fix: On the keyboard path, always use the current view centre (or a crosshair the user can move with the keyboard) and ignore pointer memory. Clear `lastPointerRef` in `closeMenu`. Announce the coordinates when the menu is opened from the keyboard.
- automatable: yes. Playwright: open, copy, close, pan, then open and copy again, and assert the clipboard text differs.
- confidence: high

### CR-UI-008

- id: CR-UI-008
- title: Selecting a search result in the inline (desktop) search removes the focused result button. Focus falls to `<body>` unless the selection-info panel takes it.
- location: `packages/ui/src/js/components/search/result-entry.jsx:23-34`; `packages/ui/src/js/store/reducers.ts:363-368`; `packages/ui/src/js/components/search/index.jsx:67-78`; `packages/ui/src/js/components/map-overlay/search-overlay.jsx:65`
- owner: @mapsight/ui
- wcag: 2.4.3 Focus Order (A)
- impact: moderate
- affected users: keyboard, screen reader
- evidence:
    - `SELECT_SEARCH_RESULT` sets `searchQuery: ""`, so `{query && (<output>…)}` unmounts together with the
      focused `<button>`.
    - In the inline search `closeSearch` is undefined, so nothing moves focus.
    - Only when the selection-info panel is shown with keyboard control (`wrapper.jsx:20`) does focus land
      somewhere useful.
    - With `detailsInList`, the fullscreen list, or hosts that show details elsewhere, focus is lost.
- reproduce:
    1. Set `list.detailsInList: true` (or use a host without `MainPanel`).
    2. Type in the map search, Tab to a result, and press Enter.
    3. `document.activeElement === document.body`, and the next Tab starts at the top of the page.
- fix: After selection, move focus deliberately: to the selected row or details heading, or back to the search input together with an announcement ("{Name} ausgewählt"). Add an `onResultSelected` hook for hosts.
- automatable: yes. Playwright: assert `activeElement !== body` after selecting a result.
- confidence: medium

### CR-UI-009

- id: CR-UI-009
- title: Result counts and tool outcomes aren't announced: search hits, list filtering, page changes, measurements, geolocation progress and errors, and copy results.
- location:
    - `packages/ui/src/js/components/search/index.jsx:67-77` (`<output>` wraps the whole result list); `packages/ui/src/js/components/search/result.jsx:88` (`loadingMessage={null}`, no count)
    - `packages/ui/src/js/components/feature-list/filter.jsx:33-49`
    - `packages/ui/src/js/components/feature-list/pagination.tsx:34-36`
    - `packages/ui/src/js/components/map-overlay/measure-distance-overlay.jsx:47-53`; `packages/ui/src/js/components/map-overlay/tool-overlay.tsx:46`
    - `packages/ui/src/js/components/map-overlay/user-geo-location-button.jsx:66-76`
    - `packages/ui/src/js/components/feature-list-sorting/feature-list-sorting.tsx:98`; `packages/ui/src/js/components/feature-list-sorting/status-indicator.jsx:1-8`
    - `packages/ui/src/js/components/place-actions/place-actions.tsx:157-166`, `:325-335`
    - `packages/ui/src/js/components/feature-list-cycling/feature-list-cycling.jsx:34-59`
- owner: @mapsight/ui
- wcag: 4.1.3 Status Messages (AA)
- impact: moderate
- affected users: screen reader, cognitive
- evidence: `announceStatus` is only used by the map-point menu and the fullscreen wrapper. Elsewhere:
    - **Search:** `<output>` (implicit `role="status"`, atomic) contains the entire result list. Screen
      readers either read every hit on each update or nothing. There's no "N Treffer" message, and loading
      is silent.
    - **List filter:** typing in it changes the rows with no count.
    - **Measurement:** the value is replaced in a plain `<div>`, and the instruction text switches without an
      announcement.
    - **Geolocation:** "requesting" and "error" exist only as CSS modifiers (`geo-location--error`). The
      sort `StatusIndicator` is an empty `div` with a class.
    - **Copy:** success only changes the button text or `aria-label`, and failures are swallowed
      (`catch { setCopied(false) }`).
    - **Cycling:** prev/next changes the selection silently, with no "x of n".
- reproduce:
    1. With NVDA, type "Rathaus" in the search: no count is announced.
    2. Filter the list: nothing is announced.
    3. Deny geolocation and press "Zum eigenen Standort springen": nothing is announced.
    4. Finish a measured line: the length isn't spoken.
- fix: Route these through one polite live region (the `announceStatus` helper already exists), with translate keys:
    - "{n} Treffer" / "Keine Treffer", debounced
    - "{n} von {total} Einträgen"
    - "Seite {n} von {m}"
    - "Strecke: {value}"
    - "Standort wird ermittelt …" / an error via `role="alert"`
    - "Link kopiert" / "Kopieren fehlgeschlagen"
    - "Eintrag {i} von {n}: {name}"

    Replace the `<output>` wrapper with a plain container plus a separate count status. Let hosts turn
    announcements off.

- automatable: partly. Playwright can read the announcer node (`[aria-live]`) after each action.
- confidence: high for the missing messages; medium for the `<output>` verbosity (depends on the screen reader)

### CR-UI-010

- id: CR-UI-010
- title: The base-layer radiogroup disables the checked radio and has no arrow-key navigation. The current base map can't be focused and is announced as unavailable.
- location: `packages/ui/src/js/components/switcher/SwitcherEntry.tsx:101-108`, `:163`, `:169-181`; `packages/ui/src/js/components/switcher/SwitcherButton.jsx:13-24`; `packages/ui/src/js/components/layer-switcher/SplitBaseLayerSwitcher.tsx:195-201`
- owner: @mapsight/ui
- wcag: 4.1.2 Name, Role, Value (A) (the state is misreported as disabled); APG Radio Group
- impact: moderate
- affected users: keyboard, screen reader
- evidence: `cannotDeselect = exclusive && active` leads to `<button role="radio" disabled={cannotDeselect}>`:
    - The checked radio drops out of the Tab order and is exposed as disabled.
    - Each unchecked radio is its own Tab stop, and there's no ArrowUp/ArrowDown handling.
    - The `aria-label` repeats the state ("…, Aktiv. Eine Basiskarte muss ausgewählt bleiben.") on top of
      `aria-checked`.
- reproduce:
    1. Open "Ebenen" (split mode) and Tab through "Basiskarte". The active base map is skipped.
    2. NVDA reads it as "Optionsfeld, aktiviert, nicht verfügbar".
    3. Arrow keys don't move between base maps.
- fix: Use native `<input type="radio" name=…>` or react-aria `useRadioGroup`. The checked radio is the single Tab stop, arrow keys move and select, and the checked option is not disabled (re-selecting it does nothing). Use the title alone as the label.
- automatable: partly (axe doesn't flag it). Playwright: Tab into the group, assert focus lands on `[aria-checked=true]`, and assert ArrowDown selects the next radio.
- confidence: high

### CR-UI-011

- id: CR-UI-011
- title: `BottomSheet` hides its heading inside the focusable separator, uses pixel values for the separator value, closes on any Escape on the page, and defaults to the English name "Resize".
- location: `packages/ui/src/js/components/bottom-sheet/BottomSheet.tsx:94`, `:205-216`, `:338-362` (`h2` at `:360`), `:343-346`
- owner: @mapsight/ui
- wcag: 1.3.1 Info and Relationships (A); 2.4.6 Headings and Labels (AA); 3.1.2 Language of Parts (AA) for the default; APG Window Splitter
- impact: moderate
- affected users: screen reader, keyboard
- evidence:
    ```tsx
    <div role="separator" tabIndex={0} aria-label={resizeLabel} aria-valuenow={height} …>
      <div className="ms3-bottom-sheet__handle" aria-hidden="true"/>
      {title != null ? <h2 className="ms3-bottom-sheet__title">{title}</h2> : null}
    </div>
    ```
    - `separator` has presentational children (ARIA 1.2), so the `h2` drops out of the accessibility tree:
      heading navigation can't find the sheet title, and the title isn't part of any name.
    - `resizeLabel` defaults to `"Resize"`.
    - `aria-valuenow`, `aria-valuemin` and `aria-valuemax` are raw pixel heights (fractions while dragging),
      and `snapValueText` is optional.
    - `document.addEventListener("keydown")` dismisses on any Escape without checking `defaultPrevented` or
      where focus is. For example, Escape in a `NativeDialog` opened from inside the sheet (place-actions
      share dialog) closes both the dialog and the sheet.
- reproduce:
    1. Render a sheet titled "Rathaus".
    2. NVDA's H key doesn't find "Rathaus". Tabbing to the handle announces "Resize, Trennlinie, 347".
    3. Open the share dialog inside the sheet and press Escape: both the dialog and the sheet close.
- fix:
    - Render the title outside the separator (`<h2 id>` in the header) and point the region's
      `aria-labelledby` at it.
    - Make `resizeLabel` required, or default it to `translate("ui.bottom-sheet.resize")`.
    - Provide a default `snapValueText` and use the snap index or a percentage as `aria-valuenow`.
    - Handle Escape only when focus is inside the sheet and `!event.defaultPrevented`.
- automatable: partly. A testing-library unit test can call `getByRole("heading", {name})`; the English default is caught by the existing English-strings check.
- confidence: medium (verify in the actual screen reader that the heading is pruned)

### CR-UI-012

- id: CR-UI-012
- title: Hover tooltips can't be dismissed with Escape, and the pointer can't move onto them: the hint.css tooltip on the region selector and the map feature tooltip.
- location: `packages/ui/src/js/components/hint-tooltip.tsx:64-87`; `packages/ui/src/js/components/map-overlay/region-selector.jsx:55`; `packages/ui/src/scss/blocks/_hint.scss:56-63` (hint.css 3.0.0: `:hover` only, `pointer-events: none`); `packages/ui/src/js/components/map-synced-interlay/tooltip.tsx:96-123`, `:163-167`; `packages/ui/src/scss/blocks/_tooltip.scss:16-31`
- owner: @mapsight/ui
- wcag: 1.4.13 Content on Hover or Focus (AA)
- impact: moderate
- affected users: low vision (magnification), motion
- evidence:
    - **Region selector:** `HintTooltip` uses hint.css unless `future.v8_ariaControlTooltip` is set. That
      tooltip is `::after{content:attr(aria-label)}` on `:hover` with `pointer-events:none`, so it isn't
      hoverable and has no Escape.
    - **Map feature tooltip:** it follows the cursor (`mousemove`) over map content, has no Escape handler,
      and hides only on `mouseout` or unhighlight.
    - It also uses `white-space: nowrap; overflow: hidden; max-width: 300px`, which truncates names.
- reproduce:
    1. Hover the region selector and press Escape: the tooltip stays. Move the pointer onto it: it disappears.
    2. Hover a POI: the tooltip covers neighbouring POIs, and Escape doesn't hide it.
- fix: Turn `v8_ariaControlTooltip` on by default (react-aria `Tooltip` handles Escape and hover) or drop hint.css. For the map tooltip, add an Escape listener that hides it until the next pointer move, and allow the text to wrap.
- automatable: partly. Playwright: hover, press Escape, and assert the tooltip is hidden.
- confidence: medium (whether "hoverable" applies to cursor-following content is debatable; the missing Escape dismissal is clear)

### CR-UI-013

- id: CR-UI-013
- title: The place-actions share control renders a visually hidden permalink that can still take focus, creating an invisible Tab stop.
- location: `packages/ui/src/js/components/place-actions/place-actions.tsx:220-225`; `packages/ui/src/scss/helpers/visually-hidden.scss:6-8` (mixin called without `$focusable`)
- owner: @mapsight/ui
- wcag: 2.4.7 Focus Visible (AA)
- impact: moderate
- affected users: keyboard, low vision
- evidence: `<a className="ms3-place-actions__permalink ms3-visuallyhidden" href={share.href}>`. `.ms3-visuallyhidden` uses `visually-hidden()` with `$focusable: false`, so the link stays clipped to 1 px even when focused.
- reproduce: Select a place that has place actions (share), focus the share button, and press Tab. One Tab stop shows no focus at all.
- fix: Either take it out of the Tab order (`tabIndex={-1}`, if it only exists for no-JS or SEO), or add a focusable variant (`ms3-visuallyhidden--focusable` using `visually-hidden(true)`).
- automatable: yes. The existing Tab walk's focus-visible check catches it once the walk includes a state with a selected place.
- confidence: high

### CR-UI-014

- id: CR-UI-014
- title: The map's keyboard focus target has no role or name, and the keyboard commands (arrows, +/−, Shift+F10) aren't described anywhere.
- location: `packages/ui/src/js/components/map.tsx:39-51`; `packages/ui/src/js/helpers/i18n/de.ts:149-164` (`ui.map.usage.*` exists but is only shown if a host wires it into a legend); `packages/core/src/js/lib/map/lib/WithMap.ts:154-158` (`keyboardEventTarget` not set, so OL listens on this div)
- owner: @mapsight/ui (core: no change required)
- wcag: 4.1.2 Name, Role, Value (A); 3.3.2 Labels or Instructions (A)
- impact: moderate
- affected users: screen reader, keyboard, cognitive
- evidence: `attributes.tabIndex = 0; <div className="ms3-map-target" …><span className="ms3-visuallyhidden">{translate("ui.map.visuallyhidden")}</span>`.
    - This is a generic `div` (it doesn't get a name from its content).
    - The text only says "Dieser Bereich der Webseite zeigt eine Landkarte."
    - Nothing describes KeyboardPan, KeyboardZoom or Shift+F10.
    - The package SCSS has no `:focus-visible` rule for `.ms3-map-target`, so it relies on the browser's
      default outline.
- reproduce: Tab to the map with NVDA or VoiceOver. It announces nothing useful, or only the hidden sentence, with no hint that arrows pan, +/− zoom, and Shift+F10 opens the point menu.
- fix:
    - Give the target `role="region"`, `aria-roledescription="Karte"`, and an `aria-label` (map title).
    - Add `aria-describedby` pointing to visually hidden usage text: `ui.map.usage.*` extended with
      Shift+F10, shown by default.
    - Offer an optional visible "Tastaturbedienung" toggle.
    - Add a package `:focus-visible` ring.
- automatable: partly. The Tab walk already flags the role-less stop; whether instructions are present has to be checked manually.
- confidence: high

### CR-UI-015

- id: CR-UI-015
- title: Attribution text sits on a 50 % translucent white over the map tiles, so its contrast depends on the base map.
- location: `packages/ui/src/scss/_variables.scss:52`; `packages/ui/src/scss/blocks/_attribution.scss:7`, `:12-16`
- owner: @mapsight/ui
- wcag: 1.4.3 Contrast (Minimum) (AA)
- impact: moderate
- affected users: low vision
- evidence: `$ms3-attributionsBackgroundColor: rgba(255,255,255,0.5)`, and the text colour is inherited. With `#222` text over black or dark aerial pixels, the effective background is about `#808080`, giving about 4.0:1 (below 4.5:1). axe returns "incomplete" for text over images, so the automated run misses it.
- reproduce: Switch to a dark or aerial base layer, then sample the attribution text against the background behind it with a contrast analyser.
- fix: Default the alpha to at least 0.85 (or make the background opaque `--ms3-background-color`), set an explicit text colour, and document the requirement for theming.
- automatable: partly. A Playwright screenshot plus pixel sampling can check it.
- confidence: low (the result depends on the host's text colour and the base map)

### CR-UI-016

- id: CR-UI-016
- title: Secondary controls convey state only visually or through labels that change with the state: region selector, cycling dots, list toggle switch, sort select, and mobile search trigger.
- location: `packages/ui/src/js/components/map-overlay/region-selector.jsx:26-36`; `packages/ui/src/js/components/feature-list-cycling/dot.jsx:27-40`; `packages/ui/src/js/components/main-panel/list-toggle-button.jsx:23-39`; `packages/ui/src/js/components/feature-list-sorting/feature-list-sorting.tsx:82-84`; `packages/ui/src/js/components/map-overlay/search-overlay.jsx:35-49`
- owner: @mapsight/ui
- wcag: 1.3.1 Info and Relationships (A); 4.1.2 Name, Role, Value (A); APG Switch
- impact: minor
- affected users: screen reader
- evidence:
    - The selected region is shown only by the `--selected` class (no `aria-pressed` or `aria-current`).
    - Cycling dots are unnamed `<button tabIndex={-1}>` with selection shown by class only.
    - `ListToggleButton` is `role="switch" aria-checked` while its label flips between "Liste öffnen" and
      "Liste schließen" (APG: a switch's label must stay the same).
    - The sort `<select>` has no label; the instruction is a sibling text node.
    - The mobile search toggle opens a modal but has no `aria-haspopup="dialog"` or `aria-expanded`, so the
      automated open/Escape check skips it.
- reproduce: Use NVDA browse mode on these controls. No selected or current state is announced. The switch reads "Liste schließen, Schalter, ein", and the select is announced without a name.
- fix:
    - Region buttons: add `aria-pressed` or `aria-current="true"`.
    - Cycling dots: add `aria-hidden="true"` (prev/next already cover them), or label them and add a roving
      tabindex.
    - List toggle: keep the label fixed ("Liste") and keep `aria-checked`, or use a button with
      `aria-expanded` and `aria-controls`.
    - Sort select: wrap it in a `<label>`.
    - Search trigger: add `aria-haspopup="dialog"`.
- automatable: partly. axe flags the dots (`button-name`) and the select (`select-name`) when they are rendered or open.
- confidence: high

### CR-UI-017

- id: CR-UI-017
- title: English defaults are hard-coded, translation keys are missing, and the locale fallback serves German on English pages.
- location:
    - `packages/ui/src/js/helpers/i18n/index.ts:5`, `:49-57`
    - `packages/ui/src/js/components/bottom-sheet/BottomSheet.tsx:94`
    - `packages/ui/src/js/components/feature-list/pagination.tsx:17-24`, `:30-60`
    - `packages/ui/src/js/components/link-share.jsx:10-11`
    - `packages/ui/src/js/plugins/browser/share-position-link.ts:503`
- owner: @mapsight/ui
- wcag: 3.1.2 Language of Parts (AA); 2.4.6 Headings and Labels (AA)
- impact: minor (moderate where a raw key becomes an accessible name)
- affected users: screen reader, cognitive
- evidence:
    - `translate()` looks up `DICTIONARY[language]` by exact match. `<html lang="en-GB">` or `"en-US"`
      misses and falls back to `de`.
    - `resizeLabel = "Resize"`.
    - react-paginate 8.3.0 hard-codes `<ul role="navigation" aria-label="Pagination">`, which can't be
      changed through props. Its `breakAriaLabels` default ("Jump forward" / "Jump backward") isn't overridden.
    - 8.3.0 calls `ariaLabelBuilder(page, isSelectedBoolean)`, so `page === selected` is never true and
      "Sie sind aktuell auf Seite N" is never used. `aria-current` still works.
    - `translate("shareLink")` and `translate("marker")` have no keys in `de.ts` or `en.ts`, so the raw
      keys "shareLink" and "marker" show up as names.
- reproduce:
    - English host page with `lang="en-GB"`: UI strings are German.
    - German page with more than one list page: the pagination landmark is announced "Pagination", and the
      break links "Jump forward".
    - `LinkShare` without props: the button's name is "shareLink".
- fix:
    - Normalise the locale (`lang.split("-")[0]`) before lookup.
    - Add keys `ui.bottom-sheet.resize`, `ui.pagination.label`, `ui.pagination.jumpForward` and
      `ui.pagination.jumpBackward`, plus `shareLink` and `marker`.
    - Pass `breakAriaLabels`, and wrap the pagination in a translated `<nav aria-label>` (patch or replace
      react-paginate's `ul[role=navigation]`).
    - Fix the builder to `(page, isSelected) => …`.
    - Add a unit test that every `translate("…")` literal exists in `de` and `en`.
- automatable: yes. Use the English-strings check plus a key-coverage unit test.
- confidence: high

### CR-UI-018

- id: CR-UI-018
- title: The share-link modal in the feature details has no accessible name.
- location: `packages/ui/src/js/components/feature-details-content/share-feature-link-modal.jsx:15-21`
- owner: @mapsight/ui
- wcag: 4.1.2 Name, Role, Value (A)
- impact: minor
- affected users: screen reader
- evidence: The react-modal `role="dialog"` is rendered with `contentLabel` commented out (`// contentLabel="onRequestClose Example"`), and the `h3` isn't linked through `aria={{labelledby}}`.
- reproduce: In CMS details HTML, activate a `.js-ms3-feature-link--share` link. NVDA announces only "Dialog".
- fix: Pass `aria={{labelledby: headingId}}` or `contentLabel={translate("ui.feature-details.share-link.head")}`, or migrate to `NativeDialog`.
- automatable: yes. axe's `aria-dialog-name` rule fires once the dialog is open. The trigger lives in CMS HTML without `aria-haspopup`, so the trigger-based open check doesn't reach it unless that step is added.
- confidence: high

### CR-CORE-001

- id: CR-CORE-001
- title: Programmatic map animations and smooth scrolling ignore `prefers-reduced-motion`.
- location: `packages/core/src/js/lib/map/lib/WithAnimations.ts:68-78`; `packages/ui/src/js/components/map-overlay/zoom-button.jsx:59-73`; `packages/ui/src/js/components/map-overlay/user-geo-location-button.jsx:38-45`; `packages/ui/src/js/components/place-actions/place-actions.tsx:271-274`; `packages/ui/src/js/store/actions.ts:661`; `packages/ui/src/js/components/feature-list-item/hooks/useFeatureListItemScrollAndFocus.ts:53`; `packages/ui/src/js/components/feature-list/index.tsx:145`; `packages/ui/src/js/components/map-wrapper.tsx:43-46`; `packages/ui/src/js/components/feature-list-cycling/feature-list-cycling.jsx:80-84`
- owner: @mapsight/core (central `animate`/`fit`) and @mapsight/ui (scrolling)
- wcag: 2.3.3 Animation from Interactions (AAA); best practice within AA scope
- impact: minor
- affected users: motion, cognitive
- evidence: The reduced-motion commit `bd958390` only covers CSS transitions. `view.animate` and `view.fit` still run for 200–1000 ms, and `scrollIntoView({behavior: "smooth"})` is unconditional.
- reproduce: Turn on the OS "reduce motion" setting, then use the zoom buttons, region selection, "Zum eigenen Standort springen", or "Auf Karte zeigen". The map still flies and the page still scrolls smoothly.
- fix:
    - In `WithAnimations.animate` and `fit`, force `duration: 0` when
      `matchMedia("(prefers-reduced-motion: reduce)")` matches (option `respectReducedMotion`, default `true`).
    - Add a `scrollBehavior()` helper in ui that returns `"auto"` under reduced motion.
    - Set `duration: 0` on KeyboardPan and KeyboardZoom in that mode.
- automatable: yes. Playwright with `reducedMotion: "reduce"`; spy on `View.animate` durations.
- confidence: high

---

## Known gaps: still open vs. fixed

Merged a11y commits checked: `8b718fcc` (visible focus), `fe64ff02` (layer-switcher and filter-toggle names), `d45d9ebf` (tool overlays), `a65a96e6` (count-aggregator contrast, out of scope), `bd958390` (reduced motion, CSS only), `e178744b` (layer switcher inside the modal). The commit subjects carry no PR numbers, so mapping these to #330/#332/#349–#352 is by subject only.

| Source                                 | Gap                                                                               | Status                    | Evidence / remaining                                                                                                                                                                                          |
| -------------------------------------- | --------------------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/ACCESSIBILITY.md`                | Map canvas not exposed as semantic HTML                                           | Open (inherent)           | The list is the alternative, but see CR-UI-001/002/014                                                                                                                                                        |
| `docs/ACCESSIBILITY.md`                | Hard-coded greys in package source must pass AA                                   | Mostly fixed              | Tokens pass (`#636567` on `#fff` ≈ 5.9:1). Still open: translucent attribution background (CR-UI-015)                                                                                                         |
| `docs/ACCESSIBILITY.md`                | Focus indicators: no blanked `outline`                                            | Fixed (`8b718fcc`)        | No `outline: 0` left on interactive controls (only the `.ms3-modal:focus` container). Remaining invisible focus has other causes: CR-UI-003, CR-UI-013                                                        |
| `docs/ACCESSIBILITY.md`                | i18n is host responsibility until Decision 008                                    | Open                      | CR-UI-017                                                                                                                                                                                                     |
| `docs/ACCESSIBILITY.md` (status table) | Focus management: `focus-trap` / custom, migrating to React Aria                  | Open                      | `focus-trap-react` is still used in `FilterToggleControl.tsx:5,80`, `layer-switcher-overlay.tsx:5,49`, `feature-selection-info/index.tsx:4,58` and `layout/wrapper.tsx`                                       |
| `A11Y_OVERLAY_PRIMITIVES.md`           | `useNativeDialog` / `NativeDialog` / `usePopoverDialog` / `PopoverDialog` done    | Confirmed                 | Naming, Escape, focus restore and autofocus look correct                                                                                                                                                      |
| `A11Y_OVERLAY_PRIMITIVES.md`           | `BottomSheet` done (APG Window Splitter)                                          | Present, with defects     | CR-UI-011                                                                                                                                                                                                     |
| `A11Y_OVERLAY_PRIMITIVES.md`           | `components/modal` (react-modal) to migrate                                       | Open                      | Search, layers and info still use react-modal. `ShareFeatureLinkModal` has no name (CR-UI-018)                                                                                                                |
| Host integration notes                 | Tool overlays: role, focus, Escape, expanded state                                | Partly fixed (`d45d9ebf`) | Fixed: `role="region"` named by `h3`, Escape, `aria-expanded`/`aria-controls`, focus return. Open: pointer-only operation (CR-UI-004), global Escape capture (CR-UI-006), no result announcements (CR-UI-009) |
| Host integration notes                 | Filter toggles: custom open state + `focus-trap-react`                            | Open (name fixed)         | `fe64ff02` added `aria-label` from the title. Trap, unnamed panel and missing `aria-controls` remain (`FilterToggleControl.tsx:29-38`, `:79-88`)                                                              |
| Host integration notes                 | Desktop layer switcher (ui) uses `focus-trap-react`                               | Open                      | `layer-switcher-overlay.tsx:13-16`, `:47-55`; panel unnamed, trigger has no `aria-controls`. Only the mobile modal overflow was fixed (`e178744b`)                                                            |
| Host integration notes                 | Layer entries: manual `role="checkbox"`, status-only names, exclusive base layers | Partly fixed              | Names now include title and state (`fe64ff02`), and base layers are `role="radio"` in a `radiogroup`. Open: disabled checked radio, no arrow-key navigation, state duplicated in names (CR-UI-010)            |
| Host integration notes                 | Feature cycling dots: `tabIndex=-1`, unlabelled                                   | Open                      | `feature-list-cycling/dot.jsx:29` (CR-UI-016); prev/next not announced (CR-UI-009)                                                                                                                            |
| Host integration notes                 | Feature list selection: custom Enter / `tabIndex=-1` model                        | Open, worse than listed   | `head.tsx:82/102`, rows unreachable in some configs (CR-UI-001), no selected state (CR-UI-002), stale trap after close (CR-UI-003)                                                                            |
| Host integration notes                 | Search: native form is serviceable                                                | Open (new issues)         | Native form is fine. Open: focus loss after selection (CR-UI-008), no result count / `<output>` verbosity (CR-UI-009)                                                                                         |
