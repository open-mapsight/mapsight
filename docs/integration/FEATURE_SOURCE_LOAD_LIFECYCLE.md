# Feature-source load ownership

`load(controllerName, id)` starts a request for an existing source. Core assigns
its request number from a store-local sequence, independent of configurable or
rehydrated request metadata. A pending request suppresses another ordinary load;
`forceRefresh` starts a newer request. Removing and re-adding the same source does
not reuse its previous number.

The success/error actions produced by `load` carry that number. The
`FeatureSourcesController` accepts them only while the matching request is still
loading. This check happens in the reducer because asynchronous dispatch can
queue a completion before a host changes the source. An old success or failure
cannot recreate a removed source, overwrite a newer response/error, or replace
data written by a controlled edit, `setData`, or a real generic `set`/`merge` data change while the request was pending. Deep-equal data copies made by legacy config merging do not retire a request.

Changing a source's type, or an `xhr-json` source's URL, retires its old payload
and load state together: data, IDs, lookup index, fingerprints, error, loading
flag, update metadata, refresh pause, and undo/redo history.
History belongs to the old definition and cannot restore that collection into
the replacement. `doRefresh`, `timer`, filters, and other configuration are
retained. Unrelated configuration changes keep existing data and history.

Refresh timers check the current request number before scheduling another load.
A definition change retains that number so the existing timer can load the
replacement definition, even when nothing else calls `load`. Clearing the loading
flag rejects the old completion. An explicit new load assigns a new number and
retires the previous timer, preventing duplicate polling chains. The current
source continues its normal polling and error-retry behavior. This does not
cancel the underlying fetch or remove an otherwise valid URL-keyed document
cache entry; the request can still populate the existing cache for that URL.

The public `loadSuccess` and `loadFailure` helpers remain usable without a
request number for hosts that deliberately write a completion. These manual
unbound actions retain their previous behavior. Passing the optional fourth
argument binds a completion to a particular loading request. Prefer `load` for
network work so core owns the full lifecycle.

Regression tests cover deferred responses in both completion orders, queued
completions, URL/type replacement, removal/re-addition, forced refresh,
in-flight deduplication, manual completion compatibility, edits with undo, and
retired/current refresh timers, including URL replacement without an explicit
reload after a completed or still-pending request. Existing cache, HTTP
validation, and singleflight tests continue to cover the document cache
independently.

## Waiting for data

The value of `dispatch(load(...))` says nothing about completion. `load` is an
async action: the store queues it and `dispatch` returns the action object, not a
promise. Inside, a load is skipped while another is pending, skipped while the
source has an error (unless `forceRefresh`), and ignored for a missing source;
refreshing sources also keep the thunk busy until their timer fires; failures are
caught and logged, not thrown. These rules deduplicate requests and are intended.
To wait for data, observe the state instead.

`@mapsight/core/lib/feature-sources/load-state` classifies one source:

| State     | Meaning                                                                         |
| --------- | ------------------------------------------------------------------------------- |
| `missing` | No entry for the id (never added, or removed).                                  |
| `idle`    | Configured, no data, no error, no request yet. Normal right after adding it.    |
| `loading` | A request is in flight. This includes a retry that still carries the old error. |
| `ok`      | Data is present, including an empty collection and data that was never loaded.  |
| `error`   | The last load or write failed. Stale data may still be present.                 |

`@mapsight/core/lib/feature-sources/when-settled` returns a promise that never
rejects. It works with any store that has `getState` and `subscribe`:

```typescript
import {load} from "@mapsight/core/lib/feature-sources/actions";
import {whenFeatureSourcesSettled} from "@mapsight/core/lib/feature-sources/when-settled";

store.dispatch(load("featureSources", "places"));
const {status, sources} = await whenFeatureSourcesSettled(
	store,
	"featureSources",
	["places", "events"],
	{timeoutMs: 10_000, signal},
);
// status: "settled" | "timeout" | "aborted"
// sources: {places: "ok", events: "error"}
```

By default it settles when every listed source is `ok`, `error` or `missing`.
Whether the load is dispatched before or after the call does not matter, since a
source that is still `idle` is not settled. Success and failure both settle, so
check `sources` (or `whenFeatureSourceSettled` for one source, which returns
`{status, state}`) before using the data. A source removed while waiting is
`missing`. A refreshing source (`doRefresh` with `timer`) settles on its data,
not on its timer, and keeps refreshing afterwards.

Options:

- `signal` ends the wait with `status: "aborted"`; `timeoutMs` ends it with
  `status: "timeout"`. There is no timeout by default. Both report the states
  at that moment.
- `isSettled(states)` replaces the condition, for example "any source has data,
  or none is loading":
  `(states) => Object.values(states).some((s) => s === "ok") || Object.values(states).every((s) => s !== "loading")`.
- `after: "next-completion"` waits for a request that starts after the call and
  ends. Use it after `load(..., {forceRefresh: true})` for a source that already
  has data, because the old data would settle the default condition before the
  queued load has started. Until a request has started, the source is reported
  as `loading`. Comparing `lastUpdate` instead does not work, since a failed
  refresh does not change it. If no request starts (a load without
  `forceRefresh` on a source with an error is skipped), only `timeoutMs` or
  `signal` end the wait, so set one of them.

The helper subscribes only while waiting; it unsubscribes, clears its timer and
removes the abort listener when it finishes. `combined` sources have data once the
controller has filled them, whether or not their members have loaded; wait for
the members to know about those. In React, `useFeatureSourceLoadState(id)` from
`@mapsight/ui/hooks/useFeatureSourceLoadState` returns the same classification.
