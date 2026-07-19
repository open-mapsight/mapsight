# Linked host apps

Guidance for host apps that depend on `@mapsight/*` via local `link:` (or
workspace) paths into this monorepo. Aimed at agents and humans doing
pre-OSS migration / parity work.

## Prefer a stable checkout

Point `link:../mapsight/packages/...` at a **stable** tree (`main` or
`private/develop`), not an ephemeral PR worktree under `mapsight-worktrees/`.
Worktrees disappear after merge and leave broken Vite/Sass absolute paths
(e.g. missing `ol/ol.css` still resolving into a deleted directory).

## After retargeting links

1. Rebuild linked packages (`pnpm --filter @mapsight/<pkg> run build`).
2. Kill the host Vite process.
3. Clear the host’s `node_modules/.vite`.
4. Restart `pnpm dev`.

## Sass `loadPaths`

When the host imports `@mapsight/ui` SCSS that does `@use "ol/ol"`, configure
Vite with an **absolute** load path to the **host** `node_modules`:

```ts
css: {
  preprocessorOptions: {
    scss: {
      loadPaths: [path.join(appRoot, "node_modules")],
    },
  },
},
```

Relative `"node_modules"` alone is not enough once Sass resolves through a
linked package outside the host root.

## FeatureList host contract

See [Upgrade from legacy embed](../integration/UPGRADE_FROM_LEGACY_EMBED.md)
(“FeatureList `itemAs` and `overrideListHtml`”):

- `itemAs` is a **wrapper** (`FeatureListItem`’s `as`), not a full row replace.
- `overrideListHtml` is applied on that wrapper; do not mix React `children`
  with `dangerouslySetInnerHTML` on the same host link.

## Worktree hygiene

List review-only candidates after squash-merged PRs:

```bash
pnpm worktrees:stale
# or: node scripts/list-stale-worktrees.mts
```

Does not delete anything. Skips `private/*` and `wip/*` branches.

## Private sync

When this checkout includes `private/`, integrate public `main` **into**
private branches only — see [`private/README.md`](../../private/README.md)
(if present):

```bash
git fetch origin
git switch private/develop
git merge origin/main
pnpm install
git push private private/develop
```
