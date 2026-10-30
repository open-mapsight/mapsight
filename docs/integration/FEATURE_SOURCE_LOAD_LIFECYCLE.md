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
