# A11y overlay primitives (`@mapsight/ui`)

Tracking plan for reusable dialog / sheet / popover shells extracted from host
apps. No customer branding, module names, or hard-coded locale copy in these
APIs — hosts pass labels, children, and `className`.

Branch: `feature/ui-a11y-primitives`

## Status

| Primitive                            | Status   | Entry                                                                                          |
| ------------------------------------ | -------- | ---------------------------------------------------------------------------------------------- |
| `useNativeDialog`                    | **done** | `hooks/useNativeDialog`                                                                        |
| `NativeDialog`                       | **done** | `components/native-dialog`                                                                     |
| `PopoverDialog` / `usePopoverDialog` | planned  | react-aria overlay + dialog + focus (list-options pattern)                                     |
| `BottomSheet` + snap separator       | planned  | in-flow sheet; APG [Window Splitter](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/) |
| `SegmentedControl` / `MapToolbar`    | optional | only if a second host needs them                                                               |

Existing (keep / migrate toward):

- `components/modal` — react-modal shell (search/layers today)
- `hooks/useOverlayDismiss` — outside click + Escape for non-modal panels
- `components/close-overlay-button`

## Design rules

1. Prefer native `<dialog showModal>` for **modal** drawers (focus trap + inert).
2. Prefer react-aria hooks for **non-modal** popovers (position + dismiss + focus restore).
3. Do not wrap native dialogs in `useModalOverlay`.
4. Public names: no `CityMap*`, Stadtplan, or deployment-specific terms.

## Suggested adoption

1. Host apps replace hand-rolled `showModal` sync with `useNativeDialog` / `NativeDialog`.
2. Later: migrate public map-overlay mobile modals from react-modal → `NativeDialog` where a sheet layout is needed (opt-in, not a breaking flip).
3. Extract popover + bottom sheet next on this branch (separate commits / PRs fine).
