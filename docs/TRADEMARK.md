# Trademark policy

**Status:** Effective
See [Decision 011](architecture/decisions/011-license-and-brand-strategy.md).

Mapsight is an open-source **software framework**. The **Mapsight name, logo, and related branding** are not open
source. They are controlled separately from the code license.

This policy explains what you may do with the brand when using MIT-licensed Mapsight software.

---

## Official project

The **official Mapsight open-source project** is maintained at:

| Channel | Official identifier                                                                         |
| ------- | ------------------------------------------------------------------------------------------- |
| Source  | [github.com/open-mapsight/mapsight](https://github.com/open-mapsight/mapsight)              |
| npm     | [`@mapsight/*`](https://www.npmjs.com/org/mapsight) packages published from that repository |
| Docs    | [docs/LICENSING.md](LICENSING.md) and linked documentation in this repository               |

Other repositories, npm packages, websites, or social accounts are **not official** unless maintainers list them
explicitly (for example a future partner or certification page).

**Other products or services** may be published under separate repositories with their own licenses. Only artifacts
explicitly labeled by maintainers are **official Mapsight products**.

---

## What the MIT license does and does not grant

The [MIT License](../LICENSE) grants rights to use, modify, and redistribute **software and documentation** in this
public tree.

It does **not** grant rights to:

- Use **Mapsight** as the name of your product, company, or fork
- Use Mapsight **logos**, wordmarks, or trade dress
- State or imply **endorsement**, **partnership**, or **official status** without permission
- Register domain names, npm scopes, or social handles that suggest you are the Mapsight project

Trademark law still applies. Nominative use (below) is allowed; confusing similarity is not.

---

## Permitted uses (no permission needed)

You may truthfully refer to Mapsight when describing what you ship:

- **Attribution:** “Built with Mapsight”, “Powered by @mapsight/core”, “Uses the Mapsight embed API”
- **Documentation and bids:** factual references in README files, integration guides, academic work, or procurement
  documents
- **Compatibility:** “Compatible with Mapsight embed config” when technically accurate
- **Internal paths and CSS prefixes** in your deployment (for example `/mapsight/plan/` or `ms3-*` classes) when they
  are implementation detail, not marketing — hosts commonly white-label the visitor-facing experience

You must not present these as endorsement by the Mapsight maintainers.

---

## Uses that require permission

Contact [contact@open-mapsight.org](mailto:contact@open-mapsight.org) before:

- Naming a product, company, domain, or npm package **Mapsight** or **Mapsight …** (for example “Mapsight Pro”,
  “Mapsight for Drupal”)
- Using Mapsight **logos** or wordmarks in marketing, app stores, or conference materials
- Claiming **official**, **certified**, **supported by**, or **partnership with** Mapsight
- Redistributing a **modified fork** under the Mapsight name
- Registering **trademarks or domains** containing “mapsight” in a way that suggests affiliation

Maintainers may grant written permission for integrators, agencies, and public-sector programs. A formal partner list
may be published later.

---

## Forks and derivatives

You may fork MIT-licensed code and publish your own version. You must:

1. **Rename** the project in user-facing places (product name, npm package name unless under your own scope, marketing
   site title)
2. **Remove** Mapsight logos and official branding from redistributed assets unless nominatively attributing source
3. **Keep** the MIT copyright and license notice in source distributions as required by the license

Example acceptable naming: “Stadtkarte — based on Mapsight”. Not acceptable: “Mapsight Community Edition” without
permission.

---

## Logos and visual identity

Official logos and brand assets are distributed only with maintainer approval. Until brand guidelines are published:

- Do not copy the project banner or logo from GitHub/npm for your own product identity
- Default UI **watermarks** shipped in `@mapsight/ui` may be disabled or replaced by host configuration where the
  software license allows; that does not grant logo rights for external marketing

---

## Enforcement

Maintainers prefer cooperation to conflict. If you are unsure whether a use is permitted, email
[contact@open-mapsight.org](mailto:contact@open-mapsight.org) before shipping.

We may request rename, disclaimer, or removal of confusing branding. Serious misuse may be referred to trademark
registration and applicable law.

---

## Relationship to licensing

| Layer                                                 | Code license        | Brand                                                         |
| ----------------------------------------------------- | ------------------- | ------------------------------------------------------------- |
| Public `@mapsight/*` framework, starters, public docs | [MIT](LICENSING.md) | **Mapsight** name reserved; official channel is open-mapsight |
| Other Mapsight products or services (when published)  | See artifact terms  | **Official Mapsight** product names by maintainers only       |

A permissive or copyleft license on product code does not expand trademark rights. Third parties may not rebrand as
Mapsight without permission.

---

## Contact

Email [contact@open-mapsight.org](mailto:contact@open-mapsight.org) for trademark, brand, and licensing questions.

For code, documentation, and integration questions, use
[GitHub issues](https://github.com/open-mapsight/mapsight/issues).

---

## Related

- [Licensing](LICENSING.md)
- [Decision 011 — License and brand strategy](architecture/decisions/011-license-and-brand-strategy.md)
- [Contributing](development/CONTRIBUTING.md)
