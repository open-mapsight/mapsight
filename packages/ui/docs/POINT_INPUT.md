# Keyboard point input and reduced motion

`PointInputControls` is an opt-in companion to a point editor. Render it inside
Mapsight's Redux Provider, adjacent to the map or in a map overlay slot:

```tsx
import PointInputControls from "@mapsight/ui/components/point-input";

<PointInputControls featureSourceId="pointInput_featureSource" />;
```

Use the source ID created by `EditorMixin`, with `draw.type: "Point"` and
`draw.replacePrevious: true`. The map must be keyboard-focusable with OL
KeyboardPan/KeyboardZoom interactions (the UI defaults). Tab to the map, pan with
the arrows and zoom with +/−. The crosshair marks the view centre. Enter on the
focused map, or the visible **Use map centre** button, confirms it. Tab can leave
the map normally. The status reports latitude/longitude and confirmation.

Confirmation replaces the source's FeatureCollection with a single Point,
projected from the actual OL view/user projection into `featureProjection`
(default EPSG:4326). The source must be dedicated to this one-point input.
`mapControllerName`, `featureSourcesControllerName` and `featureId` can be set for
custom controllers and IDs. Disable/unmount these controls outside point-input
mode; multiple simultaneously enabled editors on the same target are unsupported.
Do not render them when the map's keyboard control is disabled.

This uses the same Redux source as pointer input, so host form observers receive
the result. It deliberately does not synthesize pointer events or `drawend`:
OL's public `Draw.appendCoordinates()` supports lines/polygons, not Points.
Hosts depending on `drawend` need to observe the point source for both paths.
The component itself does not modify host form fields. Restore the initial point
as usual before mounting; panning alone never changes that value.

The component reads DOM only in effects, binds Enter to the current map target,
ignores nested controls/modifiers/repeat, and removes listeners/descriptions on
unmount, disable and target replacement. SSR renders the instructions and a disabled
confirmation button without dispatching; hydration enables it after mount. The
keyboard enhancement does not change existing editor/tool defaults.

Core map animate/fit and feature-centering methods honor reduced motion at
execution time. Enabling reduce motion during a core transition cancels it and
settles its destination with zero duration. Idle/detached/replaced views release
the preference listener. Native OL keyboard pan/zoom choose a zero-duration OL
handler per key event while preserving configured conditions, deltas and normal
durations otherwise. UI scroll requests use `instant` under reduced motion
(`auto` could inherit CSS smooth scrolling). No preference is serialized into SSR
state. Custom OL interactions, kinetic pointer movement and external direct
`view.animate()` calls remain the integrator's responsibility.

Automated evidence: core tests exercise queued/in-flight preference changes,
actions, geometry/feature fits, centering, native keyboard duration and no-DOM
execution. UI tests use an actual OL map and EditorMixin source to pan, confirm,
replace a pointer-created point, validate projections, isolate focus and remount,
and render without a DOM. These are programmatic checks, not manual browser or
screen-reader acceptance. Host form/CMS integration, overlay placement on small
maps and manual assistive-technology checks remain host release gates.
