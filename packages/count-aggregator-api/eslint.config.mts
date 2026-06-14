import {defineConfig} from "eslint/config";

import baseConfig from "../../configs/eslint-config-base.mts";

export default defineConfig([
	baseConfig,
	{
		ignores: [
			"src/generated/**/*",
			"**/*.test.ts",
			"scripts/**/*",
			"vitest.smoke.config.ts",
		],
	},
]);
