# npm Trusted Publishing

How maintainers prepare a new `@mapsight/*` package for release through the
GitHub Actions release workflow.

The monorepo publishes packages with Changesets and npm trusted publishing
(OIDC). Existing packages are published automatically when the Changesets
version PR is merged. New package names need one bootstrap step on npm first,
because npm can only configure trusted publishing after a package record exists.

## When this is needed

Use this process before merging a Changesets version PR that publishes a new
package name for the first time.

Do not manually publish the real release version from a package directory. The
real version should still be published by CI through `changeset publish`.

## Bootstrap the package record

Create and publish a minimal placeholder package at `0.0.0`. Use the real
package name, but not the real release contents.

```bash
npm login
npm whoami
```

Create a temporary directory with a minimal `package.json`:

```json
{
	"name": "@mapsight/new-package",
	"version": "0.0.0",
	"description": "Bootstrap package record for npm trusted publishing.",
	"license": "MIT",
	"repository": {
		"type": "git",
		"url": "https://github.com/open-mapsight/mapsight.git"
	}
}
```

Add a small `README.md`, then publish the placeholder:

```bash
npm publish /path/to/temporary-package --access public
```

After this step, `npm view @mapsight/new-package version` should return
`0.0.0`.

## Configure trusted publishing

Configure npm to trust the Mapsight release workflow for that package:

```bash
npx --yes npm@latest trust github @mapsight/new-package \
	--repo open-mapsight/mapsight \
	--file ci.yml \
	--env production \
	--allow-publish \
	-y
```

Use `npx --yes npm@latest` or another npm version that supports
`--allow-publish`; older npm CLIs may fail with an unhelpful registry `400`.

Verify the trust configuration:

```bash
npx --yes npm@latest trust list @mapsight/new-package
```

The package should list a GitHub Actions trust configuration for
`open-mapsight/mapsight`, workflow file `ci.yml`, environment `production`.

## Release normally

Once the package record and trusted publisher are configured, merge the
Changesets version PR. The release workflow on `main` runs `pnpm run release`
and publishes the real package version through OIDC.
