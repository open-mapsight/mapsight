# Licensing

Mapsight is published on [GitHub](https://github.com/open-mapsight/mapsight)
and [npm](https://www.npmjs.com/org/mapsight) under the `@mapsight/*` scope.

## Current status

This repository **does not yet include an OSI-approved `LICENSE` file** at the root. Until one is added:

- **Do not assume** MIT, Apache-2.0, EUPL, or any other license.
- Treat the code as **source-available** for inspection and contribution discussion, not as freely licensed for all
  uses.
- **Contact the maintainers** before redistribution, proprietary embedding, or production deployment if license terms
  matter to your organization.

## Intent

The project is intended to be **fully open source**. Maintainers are evaluating license options aligned with:

- npm and global integrator use
- German public-sector **Public Money – Public Code** practice
- Optional alignment with ecosystems such as [CIVITAS CORE](https://www.civitasconnect.digital/civitas-core/)
  and [opencode.de](https://opencode.de)

When a license is chosen, this file will be updated with the SPDX identifier, a link to the full license text, and a
short rationale.

## Companion PHP components

| Component                                                       | License (check monorepo) |
| --------------------------------------------------------------- | ------------------------ |
| [mapsight-pulp](https://github.com/open-mapsight/mapsight-pulp) | See upstream `LICENSE`   |
| [tile-proxy](https://github.com/open-mapsight/mapsight-pulp)    | See upstream `LICENSE`   |

Packages in this monorepo declare `"license": "UNLICENSED"` in `package.json` until a root license is applied
consistently.

## FAQ

### Can we evaluate Mapsight in development?

Yes for **inspection and internal evaluation** in this repository. Do not assume production redistribution rights until
an OSI license is published.

### Can we contribute docs or code before the license is final?

Yes — open a [GitHub issue](https://github.com/open-mapsight/mapsight/issues) or pull request. Copyright and license
grant will be clarified when the project-wide license is chosen.

### Does the undecided license block CIVITAS / opencode.de listing?

Formal ecosystem listing typically requires a **clear SPDX license**. Maintainers are evaluating options aligned with
PMPC practice — see Intent above. Timeline is **not yet committed**.

## Contact

Until a root `LICENSE` file exists:

- **GitHub:** [open an issue](https://github.com/open-mapsight/mapsight/issues) — describe your use case for licensing
  questions
- **Production / redistribution:** same channel; maintainers respond on a best-effort basis

## Documentation

Documentation in `docs/` follows the same status unless otherwise noted. Contribution of docs does not transfer
copyright; a project-wide license and contributor policy will be published with the code license decision.
