# A11y overlay primitives (`@mapsight/ui`)

Tracking plan for reusable dialog / sheet / popover shells extracted from host
apps. No customer branding, module names, or hard-coded locale copy in these
APIs — hosts pass labels, children, and `className`.

## Status

| Primitive                         | Status   | Entry                                           |
| --------------------------------- | -------- | ----------------------------------------------- |
| `useNativeDialog`                 | **done** | `hooks/useNativeDialog`                         |
| `NativeDialog`                    | **done** | `components/native-dialog`                      |
| `usePopoverDialog`                | **done** | `hooks/usePopoverDialog`                        |
| `PopoverDialog`                   | **done** | `components/popover-dialog`                     |
| `BottomSheet` + snap helpers      | **done** | `components/bottom-sheet` (APG Window Splitter) |
| `SegmentedControl` / `MapToolbar` | optional | only if a second host needs them                |

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
3. Host apps adopt shells; optional SCSS for `ms3-bottom-sheet` / popover later.

### BottomSheet notes

- In-flow (not modal): no focus trap; Escape only if `onDismiss` is passed.
- Pass custom `snaps` when a floating viewport bar needs clearance.
- Prefer a snaps **factory** (`() => number[]`) so resize refreshes heights without unstable array deps.

### PopoverDialog usage sketch

```tsx
const triggerRef = useRef<HTMLButtonElement>(null);
const popoverRef = useRef<HTMLDivElement>(null);
const {buttonProps} = useButton({onPress: toggle}, triggerRef);
const {popoverProps, titleProps, triggerAriaProps} = usePopoverDialog({
	isOpen,
	onClose,
	triggerRef,
	popoverRef,
	popoverId: "my-popover",
});

<button {...buttonProps} {...triggerAriaProps} ref={triggerRef} />;
{
	/* or shell: */
}
<PopoverDialog isOpen onClose triggerRef={triggerRef} title="…">
	…
</PopoverDialog>;
```
