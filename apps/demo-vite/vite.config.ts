import {join} from "node:path";

import tailwindcss from "@tailwindcss/vite";
import {defineConfig} from "vite";

import {
	createWorkspaceDevAliases,
	workspacePackages,
} from "../../configs/vite-workspace-dev.mts";

export default defineConfig(({command}) => ({
	root: "src",
	publicDir: "../public",
	resolve: {
		alias: [
			...(command === "serve" ? createWorkspaceDevAliases() : []),
			{
				find: /~(.+)/,
				replacement: join(process.cwd(), "node_modules/$1"),
			},
		],
	},
	optimizeDeps: {
		exclude: [...workspacePackages],
	},
	build: {
		outDir: "../dist",
		emptyOutDir: true,
		license: true,
		rolldownOptions: {
			input: [
				"index.html",
				"custom.html",
				"simple-map.html",
				"router/index.html",
				"full/index.html",
			],
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
	server: {
		watch: {
			ignored: ["**/node_modules/**", "!**/node_modules/@mapsight/**"],
		},
	},
	plugins: [tailwindcss()],
	css: {
		preprocessorOptions: {
			scss: {
				silenceDeprecations: ["legacy-js-api"],
				quietDeps: true,
				loadPaths: ["node_modules"],
			},
		},
	},
}));
