# Compact feature-source SSR indexes

`nodeEmbed` can omit the derived `featureSources.*.ids` and
`featureSources.*.featuresById` fields from dehydrated state. This is opt-in; the
default remains the full state format.

```ts
import nodeEmbed from "@mapsight/ui/embed/node";

const embed = nodeEmbed({
	styleFunction,
	baseMapsightConfig,
	createOptions,
	compactFeatureSourceIndexes: true,
});

await embed.renderAsync();
const fragment = embed.emitFragment({id: "map"});
// getDehydratedState() uses the same compact setting.
```

The browser continues to use `browserEmbed` without extra options. Direct
`create(..., {reHydratedState})` and declarative `<Instance>` use the same store
initialization path. The standard core `FeatureSourcesController` rebuilds missing
indexes from `data` before `create()` captures `serverState`, before browser
plugins, and before React hydration. Feed the wire state through this path rather
than passing it directly to a React-Redux provider. A host replacing that
controller must supply equivalent normalization before enabling compaction.

There is no new envelope or version marker: this is ordinary state JSON with two
optional derived fields omitted. Full snapshots and client-only mounts continue
to work. Compatibility is covered with core 14.6.8 and the matching UI build;
hosts should validate their deployed client before enabling the server option.

## What is retained

The source `data`, feature order, collection metadata (including `crs`),
fingerprint, count, configuration, filters, selection state, loading/error state,
and edit history remain in the snapshot. Duplicate IDs retain core's existing
first-feature lookup semantics and the complete ordered `ids` sequence after
normalization. Restored lookup entries share their feature objects with the
runtime collection. Existing in-flight loading sanitization still applies.

Only the default `featureSources` slice is compacted. Other controller slices
are unchanged. Every source collection remains, including combined sources and
custom or edited combined snapshots. Reconstructing combined data from members
would require separate handling for metadata, edits, history, errors, and
dependent-source ordering; this option does not perform that transformation.

The encoder makes shallow copies of the affected objects before JSON
serialization. It never deletes indexes from the live store, and browser
selectors continue to have indexed runtime access.

Hosts with a custom dehydration pipeline can apply the same projection before
serializing a snapshot:

```ts
import {compactFeatureSourceIndexes} from "@mapsight/ui/embed/compact-feature-source-indexes";

const json = JSON.stringify(compactFeatureSourceIndexes(store.getState()));
```

This helper only projects indexes. Custom pipelines must retain their usual
JSON-serializability checks and in-flight request sanitization. Never dispatch
the projected state into an already-running store.

## Validation and measurement

The embed tests cover the full and compact paths, source aliases, stale indexes,
unusual IDs, duplicate IDs, filtered views, selected-feature ownership, metadata,
edit/undo/redo history, and source URL/type invalidation parity. Actual React
hydration preserves the server DOM with the default renderer, even when an
`afterCreate` plugin edits a feature before hydration commits. Existing
client-only and full-format embed tests run alongside these cases.

This reduces serialized bytes, not the runtime data model. Rebuilding indexes
has a cost; smaller JSON alone does not establish faster hydration or improved
frame rate. Measure the host's full render/parse/hydration path with the same
visible data and simulated device profiles before adopting it. Existing core
URL/type invalidation behavior is unchanged by the projection.

For a deterministic payload comparison, read one captured state JSON, then
compare the UTF-8 byte lengths of `JSON.stringify(state)` and
`JSON.stringify(compactFeatureSourceIndexes(state))`. Keep every collection and
selection identical. Measure the production HTML attribute encoding separately,
and distinguish raw bytes from gzip/Brotli bytes and browser timings.
