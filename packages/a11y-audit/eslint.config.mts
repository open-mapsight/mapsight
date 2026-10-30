import {defineConfig} from "eslint/config";

import baseConfig, {
	testFilesEslintConfig,
} from "../../configs/eslint-config-base.mts";

export default defineConfig([
	baseConfig,
	testFilesEslintConfig,
	{
		// src/cli.ts is the source of the `bin` entry (dist/cli.js)
		files: ["src/cli.ts"],
		rules: {"n/hashbang": "off"},
	},
]);
