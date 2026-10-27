# Showcase deployments

- Latest `main`: <https://showcase.open-mapsight.org>
- Pull request 123: `https://pr-123.preview.open-mapsight.org`

Every PR builds the showcase and its workspace dependencies in `Showcase build`.
PRs targeting `main`, including forks and drafts, and native stack layers whose
stack targets `main` are eligible for deployment. Each layer's preview includes
the changes below it, so the top PR previews the complete stack. Unstacked PRs
targeting other branches and stacks rooted elsewhere are not deployed.
Fork runs remain subject to
GitHub's contributor-run approval policy. Each successful current build updates
the same PR URL. Failed or superseded builds leave the last preview available.
Closing or merging a PR removes its files and marks its GitHub deployments
inactive. Reopening and pushing rebuilds the preview. A daily cleanup reconciles
missed close events. GitHub deployment statuses and the deployment job summary
provide clickable URLs. After a successful PR deployment, one **Mapsight review
links** comment points reviewers to affected screens, suggests interactions to
check, and links to the same routes on the deployed `main` showcase. Later
deployments update that comment. Closing the PR removes it.

The build receives no deployment secrets. `Showcase deployment` always checks out
orchestration from `main`, verifies the successful build's source repository,
head and current PR state through GitHub, and transfers the static artifact over
SSH. Artifact contents are never executed by the deploy job or server. The
server accepts only constrained publish/cleanup requests, checks GitHub state
again under a per-target lock, rejects unsafe archives, and atomically activates
complete releases. Other static apps can use this pattern with their own build
artifact and explicit server routes; arbitrary server runtimes are not enabled.

The count-aggregator mock API runs in a service worker in production. It shares
the resolver used by Vite during development and synthesizes JSON/CSV responses
only for the local mock API. It does not cache or intercept other requests. Thus
the entire showcase is deployable to ordinary static hosting.

## Reviewer guidance

`scripts/preview-review-links.mts` reads the deployed PR revision as Git blobs.
Its analysis lives in `scripts/preview-project.mts`. Workspace packages are
identified by their manifests, rather than a list of directory names. Source
locations come from inherited TypeScript `rootDir` / `outDir` settings; import
resolution also reads `exports`, `imports`, `publishConfig.directory`, and TS
`paths`. These JSON/JSONC files are parsed as data. No TypeScript plugins or
project code run during analysis.

The analyzer parses mounted literal React Router routes, including nested paths,
and traces runtime imports, barrel exports, literal dynamic imports, assets,
HTML entry points and Sass partials. Type-only imports and tests are excluded.
Pages terminate a trace so navigation does not turn a local page edit into an
apparent whole-site change. Router ancestors and pathless layouts identify shared
application changes. Nearby consumers take priority; at most six screens are
shown, or three representative screens for a shared application change.

Human review instructions are editorial data in
[`apps/showcase/preview-guides.json`](../../apps/showcase/preview-guides.json),
referenced by `mapsight.preview.guides` in the app manifest. Guides are keyed by
mounted **component names**, not URLs. Changing a route's URL therefore requires
no corresponding bot edit. Each page can name scenarios, defined by actual
import specifiers and suggested checks; the analyzer follows those modules'
dependencies to identify relevant scenarios. `sample` selects representative
pages; `note` supplies context such as mock data. `deprioritize` identifies shared
modules whose impact is a fallback when the diff has more specific evidence.
A new page gets its component name and a generic check even before a guide is
written. Older PRs without metadata use the trusted checkout's metadata while
retaining their own source, exports and TypeScript configuration.

Generated code and runtime-only relationships use declarative dependency edges
in the **owning package's** `mapsight.preview.generated` manifest field:

```json
{
	"inputs": ["src/vector-styles/"],
	"outputs": ["src/generated/mapsight-vector-styles/"],
	"tools": ["@mapsight/vector-style-compiler"]
}
```

`inputs` are exact files or directory prefixes relative to the package. `outputs`
are connected to their actual importing modules, even when generated files are
not tracked. `tools` names workspace dependencies whose code also affects those
outputs. For runtime relationships without an import edge, `consumers` names
existing modules instead of generated outputs. The showcase's mock worker and
traffic-style's generated icon assets use these declarations. There is no
special list of vector-style or icon packages, and the bot does not try to
interpret arbitrary shell build scripts.

`node scripts/preview-review-links.mts --check` runs during showcase CI. It fails
when a guide names an unmounted component, a scenario module stops resolving or
is no longer imported by its page, a shared-module reference breaks, or a generated
input/consumer/tool disappears or an output is no longer consumed. A route rename
keeps its guide; a component/module rename requires updating its declaration in
the same PR. Checks can prove static wiring, not that a feature is enabled by a
particular runtime configuration. Human instructions still need editorial upkeep.

This is static impact analysis and a starting point for review, not proof that
the issue reproduces on that screen. Imports through broad barrels can overstate
impact; runtime-generated imports and dynamic route definitions can be missed.
Opt-in features may require additional demo configuration described by the PR
author. Current main is a moving comparison, not a snapshot of the PR's base.
Docs-only, test-only and unsupported server/starter changes get no comment;
obsolete guidance is removed if later changes no longer affect showcase screens.

The comment job executes trusted orchestration and installs its TypeScript
parser from `main` with lifecycle scripts disabled. PR source is never checked
out or executed. It has a separate token with pull-request write permission,
deployment read permission and no SSH secrets or deployment environment. It
requires a successful deployment for the current head, the expected preview
origin, and matching live `/__preview.json` metadata. State is checked again
immediately before posting. Only this automation's marked
`github-actions[bot]` comments are edited or deleted. No additional credentials,
GitHub App, AI API key, server process or scheduled scan is needed.

To inspect a PR without posting (using your existing `gh` authentication):

```sh
GH_TOKEN="$(gh auth token)" PREVIEW_TARGET=pr-123 node scripts/preview-review-links.mts
```

Run this from a trusted checkout. Add `PREVIEW_SHA=<full-head-sha>` to pin the
expected revision; add `--write` only when intentionally updating the bot comment
from the trusted main-branch GitHub Actions job. Local runs cannot write comments.
Failed or superseded deployments are skipped. Rerunning a successful deployment
also refreshes its review comment.

## Repository setup

The `showcase-previews` GitHub environment is restricted to `main` and contains:

| Kind     | Name                  | Purpose                                                           |
| -------- | --------------------- | ----------------------------------------------------------------- |
| Secret   | `PREVIEW_SSH_KEY`     | Private key for the restricted receiver account                   |
| Secret   | `PREVIEW_KNOWN_HOSTS` | Pinned SSH host key; never accept an unverified scan during a job |
| Variable | `PREVIEW_HOST`        | SSH hostname or address                                           |
| Variable | `PREVIEW_USER`        | Restricted deployment account                                     |
| Variable | `PREVIEW_BASE_DOMAIN` | `preview.open-mapsight.org`                                       |
| Variable | `SHOWCASE_HOST`       | `showcase.open-mapsight.org`                                      |

Cloudflare/DNS credentials are managed on the host for certificate renewal and
are not needed by GitHub Actions. The receiver and web-server setup are maintained
in the deployment infrastructure repository.

For an operational retry, run `Showcase deployment` manually on `main` and supply
a successful `Showcase build` run ID. Leaving the ID empty runs cleanup. Retrying
a superseded build never overwrites the current PR or main revision.

## Verification

Run `node --test scripts/preview-deploy.test.mts scripts/preview-review-links.test.mts`
for deployment target selection, package discovery, metadata drift, screen impact
analysis and comment lifecycle checks. Also run `node scripts/preview-review-links.mts --check`.
After building, serve `apps/showcase/dist` with an ordinary static server with SPA
fallback and run `SHOWCASE_TEST_URL=http://localhost:PORT pnpm --filter
@mapsight/showcase test:e2e`. This exercises JSON results and CSV exports without
Vite's mock middleware. The deployment job also checks the served revision over
HTTPS at `/__preview.json`.
