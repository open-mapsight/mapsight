# Project history

Timeline of Mapsight as a **product and monorepo**. Facts below are **not yet verified**. For code-level detail, see git
history and package releases.

---

## Origins

Mapsight grew out of **municipal communicative map** work in Germany — embeddable React/OpenLayers experiences
integrated with **CMS-hosted pages**, not standalone geoportals. Early focus:

- Declarative map + list + filter UX for public audiences
- PHP-side data preparation (later extracted as **mapsight-pulp**)
- Reusable npm packages (`@mapsight/core`, `@mapsight/ui`) shared across deployments

---

## Monorepo evolution

| Era (approx.)   | Milestone                                                                                                                                      |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Pre-monorepo    | Per-customer frontends; shared patterns copied between projects                                                                                |
| Monorepo        | pnpm + Turborepo; packages published under `@mapsight/*`                                                                                       |
| Open GitHub     | [open-mapsight](https://github.com/open-mapsight) organization; public packages and demos                                                      |
| Companion repos | **mapsight-pulp** and **[tile-proxy](https://github.com/open-mapsight/tile-proxy)** open-sourced; optional data platform remains host-operated |

---

## People and open source

Mapsight builds on work by **many contributors** over several years — including teams and individuals who shaped the
early architecture, CMS integrations, and municipal deployments.

We intend to publish a **contributor acknowledgements** section here (with consent and bios suitable for portfolios).
That includes thanking **neonaut** and others involved in bringing Mapsight to open source. **Pending:** confirmation
and details from past contributors.

If you contributed and would like to be listed (or prefer anonymity), contact the current maintainers.

---

## Technical lineage

- **Redux as GIS runtime** — intentional choice to keep map, UI, and data in one replayable store ([
  `@mapsight/core` docs](../../packages/core/docs/REDUX_ARCHITECTURE.md)).
- **OpenLayers** — web map engine; vector and raster layers from host-configured sources.
- **Count aggregator** — domain package for traffic/counting visualizations; optional **platform** backend for imports
  and public API (host-operated today).

---

## Ecosystem context

Mapsight is one layer in a **wider municipal GIS stack**:

- **GeoServer** (or equivalent) publishes OGC layers consumed by communicative maps and optional geoportals.
- **Masterportal / CIVITAS** serve pro-user geoportals — adjacent products, not Mapsight replacements.
- **CMS** (e.g. Infosite, TYPO3) hosts embeds, supplies content, and drives Mapsight through declarative JSON — the
  primary delivery channel for embed-first maps.

---

## Open questions for maintainers

- [ ] Exact first production deployment name and year for public history
- [ ] Date of first npm publish per core package
- [ ] When mapsight-pulp split from monolith
- [ ] License decision timeline
- [ ] Contributor list and acknowledgements (awaiting consent)

When verified, remove checklist items and cite sources (release tags, blog posts, ADRs).

---

## Related

- [Principles](../architecture/PRINCIPLES.md)
- [Ecosystem](../architecture/ECOSYSTEM.md)
- [Licensing](../LICENSING.md)
