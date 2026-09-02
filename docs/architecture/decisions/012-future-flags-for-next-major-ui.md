# Decision 012: Future flags for next-major UI behavior

**Status:** Documented

**Date:** 2026-09-02

## Context

`@mapsight/ui` sometimes has to ship **both** an old and a new behavior in the same major: hosts cannot all migrate on
the day we publish. We already mark leftover APIs `@deprecated` and promise “removed in the next major,” but that does
not help when the **runtime behavior** must flip (for example hint.css control tooltips vs an ARIA `Tooltip`).

We needed a host-facing switch that:

- Keeps today’s default so existing embeds do not change
- Lets a host opt into the **next major’s** behavior now
- Does not look like a permanent product setting
- Does not require a remote/experiment flag system

`@mapsight/ui` is on the 7.x line, so the next major is v8.

## Decision

Add a `future` object on `CreateOptions`, following the Remix / React Router **future flags** contract:

```ts
createOptions: {
  future: {
    // v{major}_{behavior}: true
  },
}
```

Rules:

- Flags are **booleans**. `true` means “v8 behavior now.” Omitted or `false` means today’s behavior.
- Names are `v{major}_{behavior}` (for this line: `v8_*`).
- Use them only for **behavior flips** that must keep both implementations in one major.
- **API removals** stay `@deprecated` in JSDoc. They do not get flags.
- New work uses the new path directly. Do not hide a brand-new control behind a future flag.
- Add a key to `FutureFlags` only in the same change that reads it. An unused flag is a public no-op.
- When that major ships, the flagged behavior becomes the only behavior and the key is deleted.

The first planned consumer is leftover hint.css control tooltips (RegionSelector vs the ARIA `Tooltip`). That key
lands with the adapter that honors it, not with this empty bag.

Do **not** add a `"none"` / density option to this bag. Future flags are not a general preference API.

## Consequences

### Positive

- Hosts can adopt a breaking change incrementally and report issues before v8
- The name encodes expiry: a `v8_*` key on a v9 release would be a bug
- One documented place for “what will change in the next major”
- Avoids a growing set of permanent `createOptions` enums (`controlTooltip: "hint" | "aria"`)

### Negative / trade-offs

- `CreateOptions` grows a new public surface that must be threaded into React (components do not read it today)
- Contributors must not treat `future` as a dumping ground for experiments or remote config
- Until v8, two implementations of each flagged behavior stay in the tree

## Alternatives considered

| Option                                                   | Why not                                                      |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| Permanent mode enum (`controlTooltip: "hint" \| "aria"`) | Looks supported forever; we would never dare delete `"hint"` |
| Flip behavior in a minor with no opt-in                  | Breaks embeds that still rely on the old path                |
| Remote / percentage feature flags                        | Host-owned embeds; no flag service; overkill                 |
| Only `@deprecated` JSDoc                                 | Fine for unused exports; does not switch live behavior       |
| `"none"` on the same flag                                | Turns a deprecation switch into a tooltip-density setting    |

## References

- [CreateOptions](../../../packages/ui/src/js/types.ts)
- [React Router — future flags](https://reactrouter.com/upgrading/future)
- Hint.css deprecation (first consumer): leftover `ms3-hint--*` vs [`packages/ui/src/js/components/tooltip.tsx`](../../../packages/ui/src/js/components/tooltip.tsx)
