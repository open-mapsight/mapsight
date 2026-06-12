import {defineConfig} from "eslint/config";

import baseConfig from "../../configs/eslint-config-base-react.mts";

export default defineConfig([
	baseConfig,
	{
		ignores: ["**/*.test.ts", "**/*.test.tsx"],
	},
]);
