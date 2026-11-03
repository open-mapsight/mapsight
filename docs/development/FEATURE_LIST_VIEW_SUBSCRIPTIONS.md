# Feature-list view subscriptions

The built-in feature list already observes the current view. It shares that
value through `FeatureListContext` so its rows do not also subscribe to the
same view separately.

## Compatibility and snapshots

The context's `view` field is optional. Custom providers that omit it and
existing direct callers of `useFeatureListItemState` continue to observe the
Redux view. The fallback uses React-Redux's nested subscription and its server
snapshot, preserving Provider hydration semantics and notification ordering.

When a shared view is present, the view hook uses a stable no-op subscription.
It does not register a per-row view callback. Hook order remains the same when
a provider starts or stops supplying a view. The list's memoized context still
updates when its view changes; responsive selection, inline details and scroll
behavior continue to follow the active view.

Custom providers supplying a view should derive it from the same view state
as the list. This is a shared read, not another independently managed source of
selection or view state.

## What this does and does not optimize

The change removes one view observation per built-in row. It does not remove
membership subscriptions for selected, highlighted or preselected features, nor
does it implement notifications by feature ID. Existing global-selection
compatibility and selected-only visibility behavior remain unchanged.

Tests count nested callbacks and view-selector evaluations separately from
component renders. An unrelated action should leave rows unchanged in either
case; avoiding their view callbacks is a distinct benefit from avoiding renders.
Hydration tests use different server and current store views to check both
shared-context and fallback paths.
