# Development standards

Conventions for contributing to the Mapsight monorepo.

---

## Toolchain

| Tool           | Version / note                                                                                        |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| **Node**       | ^24.15.0 (see root `package.json` `engines`)                                                          |
| **pnpm**       | ^11.1.2 — workspace package manager                                                                   |
| **Turborepo**  | `turbo build`, `turbo test`, `turbo typecheck`, etc.                                                  |
| **TypeScript** | Shared via `configs/tsconfig-base.json`; per-package `tsconfig.json` + `tsconfig.build.json` for emit |

Install from repo root: `pnpm install`

---

## TypeScript configs

Packages that **emit** from `tsc` split configs:

| File                  | Role                                                                          |
| --------------------- | ----------------------------------------------------------------------------- |
| `tsconfig.json`       | Full project — lib + tests, `noEmit: true`; used by IDE, `pnpm typecheck`, CI |
| `tsconfig.build.json` | Emit only — excludes tests, sets `outDir`                                     |

**Do not** exclude tests from `tsconfig.json` and typecheck them elsewhere — JetBrains IDEs only auto-associate default
config names.

Reference: `packages/core`, `packages/ui`, `packages/count-aggregator-api`.

---

## Validation and schemas

- **Zod** at config boundaries — e.g. `@mapsight/ui` embed config schemas
- Prefer validating external JSON once at load time, not scattered asserts
- Redux state shape documented in [
  `packages/core/docs/REDUX_ARCHITECTURE.md`](../../packages/core/docs/REDUX_ARCHITECTURE.md)

---

## Testing pyramid

| Layer            | Tool                   | Where                                         |
| ---------------- | ---------------------- | --------------------------------------------- |
| Unit / component | Vitest                 | Packages (required in `@mapsight/core`)       |
| E2E              | Playwright             | `@mapsight/core` (`test:e2e`)                 |
| Coverage         | Uneven across packages | Target: tiered expectations per package (TBD) |

Run from root: `pnpm test` (turbo). Package-specific: `pnpm --filter @mapsight/core test`, `test:e2e`.

**Quality goal:** Playwright E2E for GIS regressions — called out in ecosystem positioning vs Masterportal (Vitest-only
upstream).

---

## Lint and format

| Command                              | Purpose                      |
| ------------------------------------ | ---------------------------- |
| `pnpm lint`                          | ESLint via turbo             |
| `pnpm format:check` / `format:write` | Prettier                     |
| `pnpm syncpack:lint`                 | Dependency version alignment |

Pre-commit: Husky runs `lint-staged` on staged files.

---

## Repository checks

`pnpm run check` runs guard scripts **in parallel**:

| Script                          | Purpose                                                     |
| ------------------------------- | ----------------------------------------------------------- |
| `check:starter-pins`            | Starter apps pin published `@mapsight/*` (no workspace:)    |
| `check:node-ts-runtime`         | Node scripts use plain `node file.ts` — no ts-node/tsx/jiti |
| `check:typecheck-test-coverage` | Packages with tests must include them in `tsconfig.json`    |

Run before opening PRs. CI runs the same `check` job.

---

## Node scripts (TypeScript)

Run repo scripts with **`node path/to/script.mts`**. Node 24 strips types natively. Do not wrap TS entrypoints with
legacy runners.

---

## Dependency policy

Aligned with [Decision 005](../architecture/decisions/005-fetch-and-tanstack-query-over-axios.md):

- **HTTP:** native `fetch`; TanStack Query for React async state — not axios
- **Supply-chain minimalism:** prefer platform APIs and workspace packages over new deps
- **syncpack:** keep catalog versions consistent across packages
- Evaluate security and license before adding dependencies — especially while root license is
  undecided ([LICENSING.md](../LICENSING.md))

---

## Project docs

- Architecture, integration, and contributor docs live in `docs/`
- Significant choices → [architecture/decisions/](../architecture/decisions/README.md)

---

## Related

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [Action guide](../../packages/core/docs/ACTION_GUIDE.md)
- [Decision index](../architecture/decisions/README.md)
