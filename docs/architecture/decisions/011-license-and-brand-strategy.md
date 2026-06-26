# Decision 011: License and brand strategy

**Status:** Documented

**Date:** 2026-06-23

## Context

The public monorepo previously had no OSI-approved license (`UNLICENSED` in package manifests). That blocked npm
adopters and formal open-source listings that require a clear SPDX identifier.

Forces in tension:

- **Commercial / integrator use:** agencies embedding maps in proprietary CMS sites without copyleft concern
- **Brand:** open code should not imply anyone may trade as “Mapsight”

## Decision

Adopt **MIT** for the public tree plus a **separate trademark policy**:

| Scope                                             | License |
| ------------------------------------------------- | ------- |
| Public tree — `@mapsight/*`, apps, starters, docs | **MIT** |

**Other products and services** that build on these libraries may be published separately under different licenses.
Those artifacts are not part of this decision until maintainers publish them with their own terms.

**Brand:** publish [TRADEMARK.md](../../TRADEMARK.md). Code licenses do not grant trademark rights. Official channels:
`github.com/open-mapsight`, npm `@mapsight/*`.

**Governance:** no contributor license agreement (CLA); inbound contributions under MIT.

## Consequences

### Positive

- Removes integrator and npm adoption blocker (MIT on the public framework)
- Brand remains curator-controlled without restricting MIT code use
- Aligns with embed-first product ([Decision 010](010-audience-scope.md)) positioning

### Negative / trade-offs

- Separate products need clear **artifact boundaries** when published

## Alternatives considered

| Option                                | Why not default                                                                        |
| ------------------------------------- | -------------------------------------------------------------------------------------- |
| **Copyleft on the public framework**  | Friction for agency embeds and npm; weaker global integrator story                     |
| **Stay unlicensed**                   | Worst case for adoption and formal OSS listing                                         |
| **Brand “protected” by license only** | Impossible — permissive licenses explicitly allow forks; trademark is the correct tool |

## Implementation checklist

### Legal and governance

- [x] Root [LICENSE](../../../LICENSE) (MIT)
- [x] Public `package.json` `"license": "MIT"`

### Repository

- [x] [LICENSING.md](../../LICENSING.md) and [CONTRIBUTING.md](../../development/CONTRIBUTING.md)

### Brand

- [x] Publish [TRADEMARK.md](../../TRADEMARK.md)

## References

- [LICENSING.md](../../LICENSING.md)
- [TRADEMARK.md](../../TRADEMARK.md)
- [POSITIONING.md](../../ecosystem/POSITIONING.md) — Masterportal comparison
