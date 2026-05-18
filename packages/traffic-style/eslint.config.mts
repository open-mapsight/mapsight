import {defineConfig} from "eslint/config";

import baseConfig from "../../configs/eslint-config-base.mts";

export default defineConfig([
	baseConfig,
	{
		files: ["scripts/*.ts"],
		ignores: ["**/*.test.ts"],
		rules: {
			"n/hashbang": "off",
		},
	},
]);
