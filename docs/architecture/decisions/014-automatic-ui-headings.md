# Decision 014: Automatic UI heading hierarchy

**Status:** Documented

**Date:** 2026-10-28

## Context

Mapsight UI appears at different heading depths in CMS pages and composed React applications. Fixed `h3`/`h4`
headings can skip ranks beneath a host's `h1`. Per-component element props help composed hosts but cannot configure
every heading rendered by the built-in `App`. Sectioning elements and landmarks do not correct native heading tags.

## Decision

Following [Decision 012](012-future-flags-for-next-major-ui.md), 7.x hosts opt into the next major's heading behavior
with `future.v8_automaticHeadings`. Omitted or false preserves historical heading elements. V8 removes the flag and
makes the automatic resolver standard.

Permanent placement preferences live in `headings`: `baseLevel` is the first heading rank inside the instance,
defaulting to 2 in automatic mode; `overrides` supplies exceptional elements by semantic slot. Explicit component
element props win. Existing list grouping remains independent: `renderGroupAs: "auto"` adopts contextual headings,
explicit tags stay explicit, and falsy values continue to disable grouping.

A React context passes the setting through `AppContext`, both default renderers, `<Instance>`, portals and component
replacements. Public `HeadingLevel`, `Heading`, and heading hooks support composed hosts. Layout wrappers do not add
depth. Actual titled sections advance their content from the resolved native heading rank. Absent headings and
non-heading labels do not introduce missing parent levels. Derived ranks cap at `h6`.

Modal dialogs start a local context with an `h2` title. Non-modal popovers and regions, including the current
`BottomSheet`, inherit the page scope. Replacements must honor the heading element/ID contract or establish an
explicit scope. Rich host content is not rewritten.

SSR and hydration use identical create options. No DOM inspection or viewport measurement selects a heading rank.
The dehydrated Redux snapshot does not carry create options.

## Alternatives

- Per-component props alone require hosts to understand every built-in section and make `App` configuration verbose.
- One base rank without overrides cannot express non-heading labels and unusual host layouts.
- Replacing whole components merely to change heading tags duplicates UI code and behavior.
- A global default flip in 7.x breaks existing host markup expectations; a numeric future flag misuses the boolean
  behavior-adoption contract.

## Consequences

Hosts can choose placement once and let built-in components maintain their relative hierarchy. Legacy markup stays
available throughout 7.x. The implementation must preserve both resolvers until v8, and hosts must explicitly migrate
fixed list-group tags when they want automatic headings. Full-page audits remain necessary, especially for non-modal
portals and arbitrary host content.

## References

- [Heading integration guide](../../../packages/ui/docs/HEADINGS.md)
- [Configuration reference](../../integration/CONFIG_REFERENCE.md#createoptionsheadings)
- [WAI heading guidance](https://www.w3.org/WAI/tutorials/page-structure/headings/)
