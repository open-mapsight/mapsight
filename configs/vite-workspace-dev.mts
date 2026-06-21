import path from "node:path";
import {fileURLToPath} from "node:url";

export type WorkspaceDevAlias = {
	find: string | RegExp;
	replacement: string;
};

const configDir = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(configDir, "..");

/** Workspace packages resolved from source during Vite dev (serve). */
export const workspacePackages = [
	"@mapsight/core",
	"@mapsight/count-aggregator-api",
	"@mapsight/count-aggregator-ui",
	"@mapsight/ui",
	"@mapsight/lib-js",
	"@mapsight/lib-ol",
	"@mapsight/lib-redux",
] as const;

const packageSourceRoots = {
	"@mapsight/core": path.join(repoRoot, "packages/core/src/js"),
	"@mapsight/count-aggregator-api": path.join(
		repoRoot,
		"packages/count-aggregator-api/src",
	),
	"@mapsight/count-aggregator-ui": path.join(
		repoRoot,
		"packages/count-aggregator-ui/src",
	),
	"@mapsight/ui": path.join(repoRoot, "packages/ui/src/js"),
	"@mapsight/lib-js": path.join(repoRoot, "packages/lib-js/src/js"),
	"@mapsight/lib-ol": path.join(repoRoot, "packages/lib-ol/src/js"),
	"@mapsight/lib-redux": path.join(repoRoot, "packages/lib-redux/src/js"),
} as const;

/**
 * Resolve workspace packages from TypeScript source in dev.
 *
 * - Skips the tsc → dist roundtrip for HMR on package changes.
 * - `@/` maps to core source (@mapsight/core's tsconfig paths). Only core uses
 *   it today; ui can adopt `@mapsight/ui/...` package-style imports internally
 *   instead of adding a second `@/` alias.
 */
export function createWorkspaceDevAliases(): WorkspaceDevAlias[] {
	const coreSourceRoot = packageSourceRoots["@mapsight/core"];
	const uiSourceRoot = packageSourceRoots["@mapsight/ui"];

	return [
		{
			find: /^@\/(.*)$/,
			replacement: path.join(coreSourceRoot, "$1"),
		},
		// @mapsight/ui subpath exports (must precede the package root alias)
		{
			find: "@mapsight/ui/async-status/components",
			replacement: path.join(
				uiSourceRoot,
				"components/async-status/index.ts",
			),
		},
		{
			find: "@mapsight/ui/async-status",
			replacement: path.join(uiSourceRoot, "lib/async-status/index.ts"),
		},
		{
			find: "@mapsight/ui/react-query",
			replacement: path.join(uiSourceRoot, "react-query/index.ts"),
		},
		...workspacePackages.map((name) => ({
			find: name,
			replacement: packageSourceRoots[name],
		})),
	];
}
