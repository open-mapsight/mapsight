import {createRequire} from "node:module";
import path from "node:path";
import {fileURLToPath} from "node:url";

import type {NextConfig} from "next";

const appRoot = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/**
 * pnpm may isolate @mapsight/ui without a sibling traffic-style.
 * Host apps declare traffic-style as a direct dep — resolve via this package root.
 */
const trafficStyleSubpaths = ["runtime", "icon-meta", "icon-style"] as const;

const mapsightResolveAliases = Object.fromEntries(
	trafficStyleSubpaths.map((subpath) => [
		`@mapsight/traffic-style/${subpath}`,
		require.resolve(`@mapsight/traffic-style/${subpath}`, {
			paths: [appRoot],
		}),
	]),
);

type WebpackConfig = {
	resolve?: {
		alias?: Record<string, string | string[] | false>;
	};
};

const uiIconWebpackAlias = {
	"@mapsight/ui/dist/img/mapsight-ui": path.join(
		appRoot,
		"node_modules/@mapsight/ui/dist/img/mapsight-ui",
	),
	"~@mapsight/ui/dist/img/mapsight-ui": path.join(
		appRoot,
		"node_modules/@mapsight/ui/dist/img/mapsight-ui",
	),
} as const;

const nextConfig: NextConfig = {
	reactCompiler: true,
	transpilePackages: [
		"@mapsight/core",
		"@mapsight/ui",
		"@mapsight/lib-ol",
		"@mapsight/lib-redux",
		"@mapsight/lib-js",
	],
	turbopack: {
		resolveAlias: mapsightResolveAliases,
	},
	sassOptions: {
		verbose: false,
		quiet: true,
		quietDeps: true,
		silenceDeprecations: [
			"import",
			"slash-div",
			"color-functions",
			"color-module-compat",
		],
		loadPaths: ["node_modules"],
	},
	webpack: (config: WebpackConfig) => {
		config.resolve ??= {};
		config.resolve.alias = {
			...config.resolve.alias,
			...mapsightResolveAliases,
			...uiIconWebpackAlias,
		};
		return config;
	},
};

export default nextConfig;
