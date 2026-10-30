# Selection details focus

The details wrapper is a non-modal region named by its headline. Existing
`enableKeyboardControl` enables autofocus when a feature is selected. Tab can
leave the region by default. Hosts that need containment can opt in using
`app.featureSelectionInfo.trapFocus: true`, or the `FeatureSelectionInfo`
`trapFocus` prop (which overrides that option). Disabling keyboard control also
deactivates the trap.

Closing with the button or Escape unmounts the live React Aria `FocusScope`,
which restores the opener. If the opener was removed, React Aria falls back
through parent scopes. The default app wrapper supplies a parent scope; custom
embeddings should also wrap their controls in a `FocusScope` to provide this
fallback. A connected opener that becomes inert needs one extra generic fallback
to the parent scope's first focusable control, since React Aria only checks
whether its restoration target is connected.

Tab leaving a restoring scope follows React Aria's traversal to the next control
after the opener, rather than continuing from the details' DOM position.

Escape in a nested dialog or handled by a child does not close the details.
Opting into `trapFocus` enables React Aria's `contain` behavior, including focus
containment on outside clicks. Leave it off to allow focus outside the region.

Collapsed main-panel content retains its data for the slide transition but is
immediately inert and hidden from assistive technology. Keyboard props always
reflect the current panel state. `isOpen={false}` renders the retained inert
snapshot outside the live scope.

Custom `FeatureSelectionInfoHeader` components receive `id`; forward it to the
visible headline to preserve the region's accessible name. The sticky visual
duplicate is hidden and receives no duplicate id.
