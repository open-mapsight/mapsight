import {defineConfig} from "eslint/config";

import baseConfig from "../../configs/eslint-config-base.mts";

export default defineConfig([
	baseConfig,
	{
		name: "todos",
		rules: {
			// FIXME: tighten once the package is cleaned up
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/no-unsafe-argument": "warn",
			"@typescript-eslint/no-unsafe-call": "warn",
			"@typescript-eslint/no-unsafe-member-access": "warn",
			"@typescript-eslint/no-unsafe-assignment": "warn",
			"@typescript-eslint/no-unsafe-return": "warn",
			"@typescript-eslint/prefer-promise-reject-errors": "warn",
			"n/no-unsupported-features/node-builtins": "warn",
		},
	},
]);
