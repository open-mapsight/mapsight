# BottomSheet focus and dismissal

`BottomSheet` is an in-flow region, with no focus trap. Its visible `title` is a
heading outside the resize separator and names the region. `label` supplies the
region name when there is no title. The resize label and default "Position n of m"
value text use the UI translations; `resizeLabel` and `snapValueText` override them.

- `dismissOnEscape`: `"within"` (default), `"document"`, or `false`. The default
  only dismisses for Escape inside the sheet. Both scopes respect `preventDefault`
  and ignore events from nested or separate dialogs. `false` keeps the close
  button available. `onDismiss` remains a request: the host controls `open`.
- `initialFocus`: `false` (default), `true`, or an element ref. Pass `true` when
  opening after a user action to focus the title, or the region if there is no
  title. A ref selects a custom target. Opening from an initial deep link can
  keep the default to avoid moving focus on page load.
- `restoreFocus`: `false` (default), `true`, or an element ref. `true` remembers the
  focused opener on opening and restores it after closing or unmounting. Use a
  ref when the opener is replaced by the host (for example when a list remounts).
  The target must be connected and outside an inert subtree. Focus already moved
  outside the sheet (for example into another overlay) is left there.

```tsx
<BottomSheet
	open={selectedByUser}
	title={place.name}
	label="Place details"
	initialFocus
	restoreFocus={listTriggerRef}
	onDismiss={clearSelection}
>
	{details}
</BottomSheet>
```

Changing focus options while the sheet is open does not start another focus
session. Closing and opening it does. A changed place in an already open sheet
can be focused explicitly by the host, or given a new React key when a new focus
session is intended.

The title is now a sibling of `.ms3-bottom-sheet__move`. Host selectors and drag
areas that assumed the title was inside the resize handle need review.
