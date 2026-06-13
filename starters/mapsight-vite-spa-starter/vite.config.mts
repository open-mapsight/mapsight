import {createRequire} from "node:module";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {defineConfig} from "vite";

const appRoot = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/**
 * pnpm may isolate @mapsight/ui without a sibling traffic-style.
 * Host apps declare traffic-style as a direct dep — resolve via this package root.
 */
const trafficStyleSubpaths = ["runtime", "icon-meta", "icon-style"] as const;

const mapsightResolveAliases = trafficStyleSubpaths.map((subpath) => ({
	find: `@mapsight/traffic-style/${subpath}`,
	replacement: require.resolve(`@mapsight/traffic-style/${subpath}`, {
		paths: [appRoot],
	}),
}));

export default defineConfig({
	root: path.join(appRoot, "src"),
	publicDir: path.join(appRoot, "public"),
	resolve: {
		alias: [
			...mapsightResolveAliases,
			{
				find: /^~(.+)$/,
				replacement: path.join(appRoot, "node_modules/$1"),
			},
			{
				find: /^@\/(.*)$/,
				replacement: path.join(appRoot, "src/$1"),
			},
		],
	},
	optimizeDeps: {
		exclude: [
			"@mapsight/traffic-style/runtime",
			"@mapsight/traffic-style/runtime-dev",
			"@mapsight/traffic-style/icon-style",
		],
	},
	build: {
		outDir: path.join(appRoot, "dist"),
		emptyOutDir: true,
		rolldownOptions: {
			input: ["index.html"],
			output: {
				codeSplitting: {
					groups: [
						{
							test: /node_modules\/ol/,
							name: "ol",
						},
						{
							test: /node_modules\/{react|redux|reselect}/,
							name: "react-redux",
						},
						{
							test: /src\/generated\/mapsight-vector-styles/,
							name: "mapsight-vector-styles",
						},
					],
				},
			},
		},
	},
	css: {
		preprocessorOptions: {
			scss: {
				silenceDeprecations: ["legacy-js-api"],
				quietDeps: true,
				loadPaths: ["node_modules"],
			},
		},
	},
});
