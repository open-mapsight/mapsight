# Native scenario documents

Vite builds `/scenarios/index.html` and `/scenarios/verwaltung/index.html` as real
files. Always link these explicit paths: the deployed `try_files {path} /index.html`
need not resolve directory indexes. No Caddy change is needed. A link from the
showcase navigation is intentionally left to the separate shell workstream.

Each HTML document owns its fonts and CSS. It does not import `global.css` or
`msui.scss`. KERN CSS is served byte-for-byte from public/vendor/kern, outside
Vite's CSS transformations; our overrides live in host.scss. `.service-map`
scopes both emitted Mapsight tokens and the mapping from KERN semantic colours,
typography, spacing and radius. The scenario opts in to `$ms3-future-v8-themedIcons`
and `$ms3-future-v8-themedSurfaces`, so product icons and surfaces follow those
tokens in both OS colour schemes without host fixes for hardcoded light colours.
There is no iframe. The small NativeInstance
helper mounts the normal React/Redux Mapsight instance and wrapper. Public
administration composes Map, TagSwitcher, FeatureList and selected details in the
host layout. It implements the first citizen task; damage reporting / point input
is not part of this first scenario.

## Local deployment and accessibility check

From the repository root, with absolute paths for this checkout:

1. `pnpm install --frozen-lockfile`
2. `VITE_SHOWCASE_OSM_TILE_URL='/tiles/osm/{z}/{x}/{y}.png' pnpm exec turbo build --filter=@mapsight/showcase... --filter=@mapsight/a11y-audit`
3. `node /home/pje/Sites/mapsight-worktrees/showcase-scenarios/apps/showcase/scripts/serve-static.mts`
4. `SHOWCASE_TEST_URL=http://127.0.0.1:5176 SCENARIO_SCREENSHOTS=/home/pje/Sites/mapsight-brand/reviews/WP5/scenarios pnpm --filter @mapsight/showcase test:e2e`
5. `pnpm --filter @mapsight/showcase test:a11y`

The static fixture server models the file-only try_files lookup and SPA fallback.
Scenario e2e tests stub same-origin tiles, abort and fail any third-party request,
run axe at 360/768/1280, check horizontal overflow, and exercise filtering and
opening hours. The CI accessibility configuration includes both documents.
The standard showcase has no unit-test script; its tests are Playwright e2e and
the audit suite.

Search hygiene: the standard App's default search overlay is replaced in the
shared demo shell, and explicitly removed from full/router/custom overlays.
A visible shared notice explains that free-place search has no static backend.
List search still filters local fixture data. No service worker is needed for
this scenario; the existing count-aggregator worker is unchanged.
