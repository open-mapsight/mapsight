import {createRequire} from "node:module";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {
	type HostEmbedConfig,
	mapsightHostEmbedDevPlugin,
	mapsightHostEmbedPlugin,
} from "@mapsight/vite-host-embed";
import {type UserConfig, defineConfig} from "vite";

/** Example deploy prefix — replace with your host path (CMS page, static site, SPA shell, …). */
const HOST_ASSETS_BASE = "/mapsight-assets";

/** Shared runtime entry imported by host page snippets. */
const HOST_EMBED_RUNTIME_ENTRY = "embed";

/** Stable app stylesheet; revalidate on deploy. */
const HOST_APP_STYLESHEET = "mapsight.css";

/** Public script name → Vite lib entry module. */
const HOST_EMBED_TYPE_ENTRIES = {
	simpleMap: "entries/simpleMap.ts",
} as const;

type HostEmbedType = keyof typeof HOST_EMBED_TYPE_ENTRIES;

/** Passed to `@mapsight/vite-host-embed` during the embed production build. */
const hostEmbedConfig = {
	assetsBase: HOST_ASSETS_BASE,
	runtimeEntry: HOST_EMBED_RUNTIME_ENTRY,
	appStylesheet: HOST_APP_STYLESHEET,
	embedTypeEntries: HOST_EMBED_TYPE_ENTRIES,
	appStylesheetPrefix: "mapsight-host",
	appStylesheetEntry: "entries/mapsight.entry.css",
	snippetSources: [{name: "simple", file: "index.html"}],
} satisfies HostEmbedConfig;

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

const zodAlias = {
	find: "zod",
	replacement: require.resolve("zod", {paths: [appRoot]}),
};

const sharedConfig: UserConfig = {
	resolve: {
		alias: [
			zodAlias,
			...mapsightResolveAliases,
			{
				find: /^~(.+)$/,
				replacement: path.join(appRoot, "node_modules/$1"),
			},
		],
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
};

const hostLibEntries = {
	[HOST_EMBED_RUNTIME_ENTRY]: path.resolve(appRoot, "entries/embed.ts"),
	...(Object.fromEntries(
		(Object.keys(HOST_EMBED_TYPE_ENTRIES) as HostEmbedType[]).map(
			(type) => [
				type,
				path.resolve(appRoot, HOST_EMBED_TYPE_ENTRIES[type]),
			],
		),
	) as Record<HostEmbedType, string>),
};

export default defineConfig(({mode}): UserConfig => {
	if (mode === "embed") {
		return {
			...sharedConfig,
			clearScreen: false,
			base: `${HOST_ASSETS_BASE}/`,
			define: {
				"process.env.NODE_ENV": JSON.stringify("production"),
				"global.process.env.NODE_ENV": JSON.stringify("production"),
				"globalThis.process.env.NODE_ENV": JSON.stringify("production"),
			},
			plugins: [mapsightHostEmbedPlugin(appRoot, hostEmbedConfig)],
			publicDir: false,
			build: {
				minify: true,
				sourcemap: false,
				cssMinify: true,
				outDir: path.join(appRoot, "dist/mapsight-assets/assets"),
				emptyOutDir: true,
				lib: {
					entry: hostLibEntries,
					formats: ["es"],
					fileName: (_, name) => `${name}.js`,
				},
				rolldownOptions: {
					treeshake: {
						annotations: false,
					},
					output: {
						entryFileNames: "[name].js",
						chunkFileNames: "[name]-[hash].js",
						assetFileNames: "[name]-[hash][extname]",
						minifyInternalExports: false,
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
		};
	}

	// Default mode: local dev page (index.html) using the same paths as production snippets.
	return {
		...sharedConfig,
		root: appRoot,
		publicDir: path.join(appRoot, "public"),
		plugins: [
			mapsightHostEmbedDevPlugin(appRoot, {
				assetsBase: hostEmbedConfig.assetsBase,
				runtimeEntry: hostEmbedConfig.runtimeEntry,
				appStylesheet: hostEmbedConfig.appStylesheet,
				embedTypeEntries: hostEmbedConfig.embedTypeEntries,
				appStylesheetEntry: hostEmbedConfig.appStylesheetEntry,
			}),
		],
		server: {
			open: true,
		},
	};
});
