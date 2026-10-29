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

Reference: `packages/core`, `packages/count-aggregator-ui`.

Packages not yet migrated are listed in the `ALLOWLIST` of
[`scripts/check-typecheck-test-coverage.mts`](../../scripts/check-typecheck-test-coverage.mts). Remove a package from
that list when migrating it — the check fails on stale entries.

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

For a short feedback loop, run only the changed tests first, then use Turbo for
package checks and their build prerequisites:

```bash
pnpm --filter @mapsight/ui exec vitest run src/js/components/hint-tooltip.test.tsx
pnpm turbo run lint typecheck test --filter=@mapsight/ui
pnpm turbo run lint typecheck --filter=@mapsight/showcase
```

Pass Vitest file filters directly through `exec vitest run`. An extra `--` passed
through a package script can cause the full suite to run instead. Turbo prepares
the showcase and vector editor's generated styles before lint/typecheck, and builds
the vector-style compiler before checking its CLI import of `dist/cli.js`.
Traffic-style checks also wait for its generated pictograms and compiled icon modules.

In a fresh worktree, run `pnpm install --frozen-lockfile` rather than linking another
checkout's `node_modules`. Turbo shares its local cache between worktrees; avoid
`clean-build` during normal iteration. Shared TypeScript/ESLint configs are cache
inputs. The showcase tile URL is excluded from automatic `VITE_*` inference in
other tasks and included in the showcase build hash. Keep full
CI coverage when adding local shortcuts; a file-only ESLint cache does not track
changes to imported types.

Run `pnpm test:starters:copy-out` after building packages to check their published surface. It packs the packages,
installs them into standalone starters, and builds the starters, including their imports of the packaged UI Sass
entrypoints. Source-file checks against `package.json` or Sass text cannot establish this integration contract.

**Quality goal:** Playwright E2E for GIS regressions — called out in ecosystem positioning vs Masterportal (Vitest-only
upstream).

### Long-term test value

Keep a test when it catches a plausible, consequential regression: a public contract, an external input boundary,
a nontrivial domain rule, a timing or concurrency interaction, or behavior spanning application components.
Small unit tests are useful when the rule itself is easy to get wrong; an integration test adds value only when
it exercises the relevant interaction rather than replacing it with mocks.

Avoid tests that merely repeat obvious assignments, constants, or forwarding wrappers. Prefer observable results
over internal object shapes, generated source text, and incidental CSS classes. Keep identity or serialization
assertions when consumers actually depend on them. Before deleting an overlapping test, check which entry point
and failure mode each test covers.

A test introduced for a fix does not expire when the fix lands. Remove migration checks with the compatibility
path they protect, and run one-off dependency checks with the affected tooling instead of keeping duplicate
dependency API tests. Document intent and usage in the appropriate guide; retain behavioral tests for important
contracts so accidental changes are still detected.

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
- Evaluate security and license before adding dependencies — they must be compatible with the MIT-licensed public
  tree ([LICENSING.md](../LICENSING.md))

---

## Project docs

- Architecture, integration, and contributor docs live in `docs/`
- Significant choices → [architecture/decisions/](../architecture/decisions/README.md)

---

## Related

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [Action guide](../../packages/core/docs/ACTION_GUIDE.md)
- [Decision index](../architecture/decisions/README.md)
