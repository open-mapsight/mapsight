# Native scenario documents

Vite builds the overview and each host page as real files:

| Document                           | Context                                                   |
| ---------------------------------- | --------------------------------------------------------- |
| `/scenarios/index.html`            | Mapsight-branded overview with shared showcase navigation |
| `/scenarios/verwaltung/index.html` | Fictional KERN citizen-service host                       |
| `/scenarios/tourismus/index.html`  | Fictional tourism host, German                            |
| `/scenarios/tourismus/en.html`     | Tourism host, English                                     |
| `/scenarios/verkehr/index.html`    | Fictional traffic-information host with simulated values  |

Always link these explicit paths: the deployed `try_files {path} /index.html`
need not resolve directory indexes. No Caddy change is needed. The overview is linked from the showcase navigation
and home page. Its shared
brand frame identifies the site as the Mapsight Showcase and links to the project
website; each host page retains its own visual identity and return link.

Each host HTML document owns its fonts and CSS and imports neither `global.css`
nor `msui.scss`. The overview alone uses the common showcase brand frame. KERN CSS is served byte-for-byte from public/vendor/kern, outside
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

From the repository root:

1. `pnpm install --frozen-lockfile`
2. `VITE_SHOWCASE_OSM_TILE_URL='/tiles/osm/{z}/{x}/{y}.png' pnpm exec turbo build --filter=@mapsight/showcase... --filter=@mapsight/a11y-audit`
3. `node apps/showcase/scripts/serve-static.mts`
4. `SHOWCASE_TEST_URL=http://127.0.0.1:5176 SCENARIO_SCREENSHOTS=/tmp/mapsight-scenarios pnpm --filter @mapsight/showcase test:e2e`
5. `pnpm --filter @mapsight/showcase test:a11y`

The static fixture server models the file-only try_files lookup and SPA fallback.
Scenario e2e tests stub same-origin tiles, abort and fail any third-party request,
run axe at 360/768/1280, check horizontal overflow, and exercise filtering and
opening hours. The CI accessibility configuration includes the overview and all host documents.
The standard showcase has no unit-test script; its tests are Playwright e2e and
the audit suite.

Search hygiene: the standard App's default search overlay is replaced in the
shared demo shell, and explicitly removed from full/router/custom overlays.
A visible shared notice explains that free-place search has no static backend.
List search still filters local fixture data. No service worker is needed for
this scenario; the existing count-aggregator worker is unchanged.

Tourism and traffic each document data provenance in their own `DATA.md`. Tourism
ships a small dated OSM extract separately from its own editorial copy. The traffic
host changes fixed fictional data through normal feature-source actions; its
combined list follows visible layers. Count widgets in traffic details use the
existing same-origin Count-Aggregator mock, with invented counter positions and
clearly synthetic values. Neither scenario provides live information.
