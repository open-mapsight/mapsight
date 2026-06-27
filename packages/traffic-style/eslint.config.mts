import {defineConfig} from "eslint/config";

import baseConfig from "../../configs/eslint-config-base.mts";

export default defineConfig([
	baseConfig,
	{
		files: ["eslint.config.mts", "scripts/**/*.ts"],
		rules: {
			"n/hashbang": "off",
			"n/no-unpublished-import": "off",
		},
	},
]);
