# Decision 008: Internationalization approach

**Status:** Target documented; library not selected

**Date:** 2026-06-13

## Context

Mapsight is developed **English-first** (code, docs, default message keys). **Production deployments** are often
multi-locale — municipalities serve residents and visitors who use languages other than the site's primary locale. Embed
configs already accept per-app `lang` props; there is no repo-wide i18n library yet.

Masterportal uses **i18next** with JSON locale files — a useful **ecosystem reference**, not a Mapsight commitment.

## Decision

**Adopt an industry-standard open-source i18n solution** that meets:

1. **Non-technical contributors** — communications and GIS staff can manage translations without code changes
2. **Multi-locale by design** — straightforward addition of locales; primary locale is a **host configuration**, not a
   hard-coded product default
3. **Host coverage** — embed snippets, SPAs, and Next.js demo hosts
4. **Modern workflows** — compatible with LLM-assisted draft/review pipelines
5. **Developer ergonomics** — English as the implementation lingua franca; extracted catalogs translatable per
   deployment

**No specific library selected yet** (i18next, FormatJS, next-intl, etc. remain candidates depending on host app).

Until this note is updated with a library choice:

- Hosts may pass `lang` and translated config strings from CMS
- Integration docs treat i18n as **host responsibility**
- Do not commit Next.js demos to one library in public integration guides

## Consequences

### Positive

- Requirements captured before locking into one stack
- Avoids coupling architecture to one country's language policy
- Avoids premature mismatch between CMS embeds and Next-only solutions

### Negative / trade-offs

- No shared translation catalog across packages yet
- `@mapsight/ui` strings may remain hard-coded until library adoption

## Alternatives considered

| Option                             | Why not (for now)                                                     |
| ---------------------------------- | --------------------------------------------------------------------- |
| **i18next (Masterportal-aligned)** | Strong ecosystem fit; not evaluated end-to-end for embed + core split |
| **next-intl in all docs**          | Couples story to Next.js; most production hosts are CMS embeds        |
| **Single-locale product only**     | Conflicts with international residents and visitors                   |
| **CMS-only strings, no library**   | Acceptable interim; does not scale to shared UI package strings       |

## References

- [Principles → UX goals](../PRINCIPLES.md#ux-goals)
- [Current vs target](../CURRENT_VS_TARGET.md#runtime-and-state)
- Planned: [POSITIONING.md](../../ecosystem/POSITIONING.md) — Masterportal i18next as reference
