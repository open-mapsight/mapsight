import {defineConfig} from "eslint/config";

import baseConfig from "../../configs/eslint-config-base.mts";

export default defineConfig([
	baseConfig,
	{
		ignores: ["scripts/**/*.test.ts"],
	},
	{
		files: ["scripts/**/*.ts"],
		ignores: ["**/*.test.ts"],
		rules: {
			"n/hashbang": "off",
			"n/no-unpublished-import": "off",
		},
	},
]);
