import {existsSync, readdirSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {defineConfig} from "eslint/config";
import tseslint from "typescript-eslint";

import baseConfig from "../configs/eslint-config-base-app.mts";

const STARTERS_DIR = path.dirname(fileURLToPath(import.meta.url));

function starterImportResolverConfigs() {
	return readdirSync(STARTERS_DIR, {withFileTypes: true})
		.filter((entry) => entry.isDirectory())
		.flatMap((entry) => {
			const tsconfigPath = path.join(
				STARTERS_DIR,
				entry.name,
				"tsconfig.json",
			);

			if (!existsSync(tsconfigPath)) {
				return [];
			}

			return [
				{
					files: [
						`${entry.name}/**/*.{ts,tsx,mts,cts}`,
						`**/${entry.name}/**/*.{ts,tsx,mts,cts}`,
					],
					settings: {
						"import-x/resolver": {
							typescript: {
								project: tsconfigPath,
							},
						},
					},
				},
			];
		});
}

/** Shared ESLint config for copy-out host starters (not shipped with the templates). */
export default defineConfig([
	baseConfig,
	{
		ignores: [
			"**/src/generated/**/*",
			"**/dist/**/*",
			"**/.next/**/*",
			"**/postcss.config.mjs",
		],
	},
	{
		files: [
			"**/src/**/*.{ts,tsx,mts,cts}",
			"**/entries/**/*.{ts,tsx,mts,cts}",
			"**/scripts/**/*.{ts,tsx,mts,cts}",
			"**/vite.config.mts",
		],
		extends: [tseslint.configs.disableTypeChecked],
		rules: {
			"import-x/no-unresolved": [
				"error",
				{
					ignore: [
						"^@mapsight/",
						"^@/generated/mapsight-vector-styles/",
						"^\\.\\./generated/mapsight-vector-styles/",
					],
				},
			],
		},
	},
	{
		files: [
			"**/src/presets/simpleMap.ts",
			"**/src/app/ui/MapsightAppUi.tsx",
			"**/src/app/ui/map-page.tsx",
			"**/src/pages/map-page.tsx",
		],
		rules: {
			"@typescript-eslint/no-unsafe-assignment": "off",
		},
	},
	...starterImportResolverConfigs(),
]);
