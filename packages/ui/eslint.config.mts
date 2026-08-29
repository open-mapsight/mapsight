import {defineConfig} from "eslint/config";

import baseConfig, {
	TEST_FILE_GLOBS,
	testFilesEslintConfig,
} from "../../configs/eslint-config-base-react.mts";

export default defineConfig([
	baseConfig,
	{
		name: "todos",
		rules: {
			// Browser API; eslint-plugin-n treats `navigator` as a Node experimental builtin.
			"n/no-unsupported-features/node-builtins": [
				"error",
				{version: ">=24.0.0", ignores: ["navigator"]},
			],

			// FIXME:
			"react/prop-types": "warn",
			"react-hooks/refs": "warn",
			"react-hooks/set-state-in-effect": "warn",

			// FIXME:
			"@typescript-eslint/no-unsafe-argument": "warn",
			"@typescript-eslint/no-unsafe-call": "warn",
			"@typescript-eslint/no-unsafe-member-access": "warn",
			"@typescript-eslint/no-unsafe-assignment": "warn",
			"@typescript-eslint/no-unsafe-return": "warn",
			"@typescript-eslint/prefer-promise-reject-errors": "warn",

			// FIXME:
			"@typescript-eslint/no-explicit-any": "warn",

			// FIXME:
			"jsx-a11y/no-autofocus": "warn",
		},
	},
	testFilesEslintConfig,
	{
		files: TEST_FILE_GLOBS,
		rules: {
			"react/prop-types": "off",
		},
	},
]);
