# Licensing

Mapsight is published on [GitHub](https://github.com/open-mapsight/mapsight)
and [npm](https://www.npmjs.com/org/mapsight) under the `@mapsight/*` scope.

The public monorepo is licensed under the **MIT License** (`MIT`).
See [Decision 011](architecture/decisions/011-license-and-brand-strategy.md).

---

## Public framework (MIT)

The public monorepo — `packages/*`, `apps/*`, `starters/*`, and `docs/` — is under the **MIT License** (`MIT`).

Includes:

- `@mapsight/core`, `@mapsight/ui`, `@mapsight/traffic-style`, and other public npm packages
- `@mapsight/vite-host-embed`, `@mapsight/vite-count-aggregator-embed`, count-aggregator packages
- Demo apps (`apps/showcase`, `apps/vector-editor`), copy-out starters, and public documentation

Full text: [LICENSE](../LICENSE) at repository root.

**Trademark:** MIT does not grant use of the **Mapsight** name or logo — [TRADEMARK.md](TRADEMARK.md).

---

## Other products and services

Maintainers may publish **separate products or services** that build on these libraries under **different licenses**.
Those artifacts are governed by their own license terms and are not part of this repository unless explicitly linked
here.

This document is engineering guidance, not legal advice.

---

## Companion repositories

| Component                    | Repository                                                      | License                |
| ---------------------------- | --------------------------------------------------------------- | ---------------------- |
| mapsight-pulp, tile-proxy    | [mapsight-pulp](https://github.com/open-mapsight/mapsight-pulp) | See upstream `LICENSE` |
| Public framework (this repo) | [mapsight](https://github.com/open-mapsight/mapsight)           | **MIT**                |

---

## FAQ

### Can we embed Mapsight in a proprietary municipal website?

**Yes** — static or module embeds (CMS snippets, SPAs) without copyleft obligations on the host site.
**Trademark:** follow [TRADEMARK.md](TRADEMARK.md); white-labeling the visitor UI is normal.

### Does Mapsight “taint” our project with copyleft?

**No** — MIT does not impose copyleft (GPL etc.) on your host site or proprietary code that uses the libraries. Other
Mapsight
products or services, if published separately, may use different terms.

### Can we fork `@mapsight/core` and sell support?

Yes under MIT, under a **different product name** — not as “Mapsight” without permission.

### Can we contribute?

Yes. Contributions are accepted under **MIT**. No CLA is planned — see Decision 011.

### What about documentation?

Public `docs/` is **MIT** (same as the public framework) unless a page explicitly states otherwise.

---

## Contact

- **Licensing and trademark:** [contact@open-mapsight.org](mailto:contact@open-mapsight.org)
- **Code, docs, and integration questions:** [GitHub issues](https://github.com/open-mapsight/mapsight/issues)

---

## Related

- [Trademark policy](TRADEMARK.md)
- [Decision 011 — License and brand strategy](architecture/decisions/011-license-and-brand-strategy.md)
- [Contributing](development/CONTRIBUTING.md)
- [Positioning — Masterportal comparison](ecosystem/POSITIONING.md)
