# Development standards

Conventions for contributing to the Mapsight monorepo.

---

## Toolchain

| Tool           | Version / note                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| **Node**       | ^24.15.0 (see root `package.json` `engines`)                                                            |
| **pnpm**       | ^11.1.2 — workspace package manager                                                                     |
| **Turborepo**  | `turbo build`, `turbo test`, `turbo typecheck`, etc.                                                    |
| **TypeScript** | Native 7.0 compiler; 6.0 compatibility API and UI declaration emit; shared `configs/tsconfig-base.json` |

Install from repo root: `pnpm install`

`pnpm exec tsc` runs the native TypeScript 7 compiler, installed as
`@typescript/native`. The `typescript` dependency uses Microsoft's official
`@typescript/typescript6` compatibility package, preserving the JavaScript
compiler API needed by ESLint, Next.js and source inspection scripts. Its compiler
is available as `tsc6`. Keep both dependencies when updating the toolchain; see
[Microsoft's side-by-side setup](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-60).

Builds use native `tsc` except UI module builds and their watch command, which use
`tsc6` to preserve the public React prop declarations for consumers with
`exactOptionalPropertyTypes`. Next.js retains its internal TypeScript 6 API check;
the standalone package typechecks use TypeScript 7.

For coding assistance in an editor with native TypeScript 7 support, select the
installed `node_modules/@typescript/native` package. The `node_modules/typescript`
package intentionally supplies the TypeScript 6 compatibility API.

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
pnpm verify --filter=@mapsight/ui
pnpm verify '--filter=...[origin/main]'
pnpm turbo run lint typecheck --filter=@mapsight/showcase
```

Pass Vitest file filters directly through `exec vitest run`. An extra `--` passed
through a package script can cause the full suite to run instead. Turbo prepares
the showcase and vector editor's generated styles before lint/typecheck, and builds
the vector-style compiler before checking its CLI import of `dist/cli.js`.
Traffic-style checks also wait for its generated pictograms and compiled icon modules.

`pnpm verify` runs package lint, typecheck and unit tests in one Turbo invocation
with at most four concurrent tasks. Use a package filter while editing, then
`--filter=...[origin/main]` to include changed packages and their consumers before
pushing. Run `git fetch origin` first to refresh that comparison; it also includes
local working-tree changes. Root configuration changes can select every package.
Root starter lint, script typechecks, config tests, browser tests and repository
guards remain available through their existing commands and in GitHub's required
CI checks.
Run `pnpm build` separately when checking production outputs; Next.js builds
recreate `.next/types` and cannot safely run alongside a starter typecheck.

Turbo replays only logs from tasks that actually run; use `--output-logs=full` when
debugging a cached result. Core, UI, lib-js, lib-ol, lib-redux and the vector-style
compiler exclude the tests omitted by their emitting TypeScript configs from the
build hash. Test changes still invalidate the owning package's lint, test and
typecheck tasks. Published documentation and generated inputs remain build inputs.

Native TypeScript 7.0.2 typechecks run without TypeScript's incremental state.
Changing `lib` or `target` can otherwise retain stale diagnostics, including
missing errors; see [the upstream issue](https://github.com/microsoft/TypeScript/issues/64552).
Standalone checks override inherited incremental/composite settings where needed,
while Next.js keeps its own TypeScript 6 build state. Turbo still caches
complete successful tasks and invalidates them when source or shared compiler
configuration changes. Emitting library builds remain non-incremental so a
missing `dist` is always rebuilt.

When creating a worktree, run `pnpm install --frozen-lockfile` rather than linking
another checkout's `node_modules`. If your development tools support setup
scripts, configure this command to run when the worktree is created.
Run `pnpm verify --filter=@mapsight/<package>` once to prepare prerequisites
before running individual test files.
Turbo shares its local cache between worktrees; avoid
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
It fixes only staged source files and runs one filtered Turbo typecheck for their
packages, reusing prior checks and preparing generated dependencies.

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
