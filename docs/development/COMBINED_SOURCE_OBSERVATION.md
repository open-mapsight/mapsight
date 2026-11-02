# Combined-source observation

Combined feature sources observe their member feature arrays and publish new
combined data when the result changes. Replacing a member with a new collection
containing equal feature data preserves the existing combined collection.

## Equal replacement and subsequent actions

The member selector caches a result for its current inputs. The observer keeps
its last **notified** result when the equality comparator suppresses an update.
After an equal replacement, those two results may therefore have different
references despite equal contents.

Without a comparison cache, unrelated store actions would repeatedly traverse
the same old and new feature data. The combined-source binding caches its last
equal reference pair. The first comparison still establishes deep equality;
subsequent comparisons of that pair do not traverse the features again.

Each binding owns a bounded cache. Changing either result requires another
comparison, and unequal results still notify the observer. The generic
`observeState` contract is unchanged, including the previous value delivered to
listeners. This optimization assumes the same immutable input discipline as the
combined member selector; it does not support mutating collection contents in
place.

## Regression coverage

`packages/core/src/js/lib/feature-sources/__tests__/combined-observer.test.ts`
uses real controllers and stores with small synthetic collections. A property
getter detects repeated feature traversal independently of wall-clock timing.
The tests cover:

- Stable inputs before and after repeated equal replacements.
- Changed feature data and a later return to earlier contents.
- Member errors and recovery.
- Binding changes and removal.
- Independent bindings and separate store instances.

Avoid interpreting fewer traversals as a general rendering or network-latency
improvement. Application profiling should distinguish source replacement work,
later subscriber callbacks, React work and map rendering.
