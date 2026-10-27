# Selection details focus

The details wrapper is a non-modal region named by its headline. Existing
`enableKeyboardControl` enables autofocus when a feature is selected. Tab can
leave the region by default. Hosts that need containment can opt in using
`app.featureSelectionInfo.trapFocus: true`, or the `FeatureSelectionInfo`
`trapFocus` prop (which overrides that option). Disabling keyboard control also
deactivates the trap.

Closing with the button or Escape restores the originating list element after
the closing render. If that element is removed or hidden, focus falls back to a
visible list container, then to the map target in the same `.ms3-wrapper`.
Escape in a nested dialog or handled by a child does not close the details.
Clicking outside an opted-in trap releases it without clearing the selection.

Collapsed main-panel content retains its data for the slide transition but is
immediately inert and hidden from assistive technology. Keyboard props always
reflect the current panel state.

Custom `FeatureSelectionInfoHeader` components receive `id`; forward it to the
visible headline to preserve the region's accessible name. The sticky visual
duplicate is hidden and receives no duplicate id.
