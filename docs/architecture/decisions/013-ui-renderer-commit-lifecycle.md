# Decision 013: UI renderer commit lifecycle

**Status:** Documented

**Date:** 2026-10-27

## Context

React's concurrent root APIs schedule rendering and hydration. Previously `create()` ran `afterRender` plugins when
the renderer returned, so viewport detection could replace the SSR view before React read its first Redux snapshot.
Hosts also supply custom renderers with arbitrary return values, including server string renderers.

## Decision

Add `props.deferCommit()`, called synchronously by asynchronous renderers before they schedule React. It returns an
idempotent completion callback. `AppContext.onCommit` invokes that callback in an effect; only then does `create()`
set `hasRendered` and invoke `afterRender`. The default browser renderer and declarative `Instance` use this contract.
Legacy renderers without a deferred commit keep synchronous completion and their existing return values.

Capture the rehydrated Redux snapshot before post-creation work and pass it as `serverState` through renderer props
to React-Redux. Retain it for the hydrated tree's lifetime, including suspended descendants. Browser-only render values
must use deterministic initial output and update after commit.

## Consequences

Hosts using asynchronous custom renderers must adopt the callback and forward the snapshot. Synchronous renderers,
including SSR, keep working without changes. No global synchronous React flush or scheduling delay is required.
`renderAsync()` continues to await pre-render plugins rather than commit. Host router hydration and DOM ownership
remain integration responsibilities; a root commit does not guarantee all suspended descendants have hydrated.

## Alternatives considered

| Option                                                | Reason not chosen                                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Force `flushSync` around host rendering               | Cannot reliably cover host scheduling or suspended descendants; forces blocking rendering. |
| Delay plugins with a timer or animation frame         | Does not report whether React has committed.                                               |
| Interpret the renderer return as a completion promise | Conflicts with arbitrary existing renderer return values and render references.            |
| Snapshot alone                                        | Prevents Redux mismatches but still starts DOM-dependent plugins before commit.            |

## References

- [SSR integration contract](../../integration/SSR_HYDRATION.md#renderer-commit-lifecycle)
- [UI render-path audit](../../../packages/ui/docs/HYDRATION_AUDIT.md)
- [Decision 006](006-ssr-state-hydration-goal.md)
