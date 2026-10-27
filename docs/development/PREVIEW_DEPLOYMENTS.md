# Showcase deployments

- Latest `main`: <https://showcase.open-mapsight.org>
- Pull request 123: `https://pr-123.preview.open-mapsight.org`

Every PR targeting `main`, including forks and drafts, builds the showcase and
its workspace dependencies in `Showcase build`. Fork runs remain subject to
GitHub's contributor-run approval policy. Each successful current build updates
the same PR URL. Failed or superseded builds leave the last preview available.
Closing or merging a PR removes its files and marks its GitHub deployments
inactive. Reopening and pushing rebuilds the preview. A daily cleanup reconciles
missed close events. GitHub deployment statuses and the deployment job summary
provide clickable URLs without adding repeated PR comments.

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

Run `node --test scripts/preview-deploy.test.mts` for deployment target selection.
After building, serve `apps/showcase/dist` with an ordinary static server with SPA
fallback and run `SHOWCASE_TEST_URL=http://localhost:PORT pnpm --filter
@mapsight/showcase test:e2e`. This exercises JSON results and CSV exports without
Vite's mock middleware. The deployment job also checks the served revision over
HTTPS at `/__preview.json`.
