import {defineConfig} from "eslint/config";

import baseConfig, {
	testFilesEslintConfig,
} from "../../configs/eslint-config-base.mts";

export default defineConfig([
	baseConfig,
	{
		name: "todos",
		rules: {
			// FIXME:
			"@typescript-eslint/no-unsafe-argument": "warn",
			"@typescript-eslint/no-unsafe-call": "warn",
			"@typescript-eslint/no-unsafe-member-access": "warn",
			"@typescript-eslint/no-unsafe-assignment": "warn",
			"@typescript-eslint/no-unsafe-return": "warn",
			"@typescript-eslint/prefer-promise-reject-errors": "warn",
		},
	},
	testFilesEslintConfig,
]);
