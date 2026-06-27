import path from "node:path";
import {fileURLToPath} from "node:url";

import js from "@eslint/js";
import type {Linter} from "eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import {importX} from "eslint-plugin-import-x";
import node from "eslint-plugin-n";
import {defineConfig} from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

const REPO_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export const TEST_FILE_GLOBS = [
	"**/*.{test,spec}.{ts,tsx,mts}",
	"**/__tests__/**/*.{ts,tsx,mts}",
];

/** Re-append after package-level rule overrides (e.g. core/ui todos). */
export const testFilesEslintConfig: Linter.Config = {
	files: TEST_FILE_GLOBS,
	rules: {
		// expect(vi.fn().method) in Vitest mock assertions.
		"@typescript-eslint/unbound-method": "off",
	},
};

const TEST_RUNNER_SAFE_CALLS = [
	{
		from: "package" as const,
		name: [
			"describe",
			"it",
			"test",
			"suite",
			"beforeAll",
			"afterAll",
			"beforeEach",
			"afterEach",
		],
		package: "vitest",
	},
	{
		from: "package" as const,
		name: [
			"test",
			"describe",
			"beforeAll",
			"afterAll",
			"beforeEach",
			"afterEach",
		],
		package: "@playwright/test",
	},
	{
		from: "package" as const,
		name: [
			"describe",
			"it",
			"test",
			"suite",
			"before",
			"after",
			"beforeEach",
			"afterEach",
		],
		package: "node:test",
	},
];

export default defineConfig([
	{
		ignores: [
			"**/node_modules/",
			".git/",
			"**/.turbo/",
			"**/dist/",
			"**/dist-*/",
			"**/generated/",
			"**/tmp/",
		],
	},
	node.configs["flat/recommended-module"],
	importX.flatConfigs.recommended,
	importX.flatConfigs.typescript,
	{
		files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
		plugins: {js},
		extends: ["js/recommended"],
		languageOptions: {
			globals: {...globals.browser, ...globals.node},
			parserOptions: {
				projectService: {
					defaultProject: "./configs/tsconfig-node.json",
					allowDefaultProject: [
						"gulpfile.mts",
						"vite.config.ts",
						"vite.config.mts",
						"vitest.config.ts",
						"prettier.config.mjs",
						"postcss.config.mts",
					],
				},
				tsconfigRootDir: REPO_ROOT,
			},
		},
		rules: {
			"@typescript-eslint/consistent-type-imports": "warn",
			"@typescript-eslint/no-unused-vars": [
				"warn", // or "error"
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					caughtErrorsIgnorePattern: "^_",
				},
			],
			"n/no-unsupported-features/node-builtins": [
				"error",
				{version: ">=24.0.0"},
			],
			"n/no-unsupported-features/es-builtins": [
				"error",
				{
					version: ">=24.0.0",
				},
			],
			"n/no-unsupported-features/es-syntax": [
				"error",
				{
					version: ">=24.0.0",
				},
			],
			"n/no-missing-import": "off",
			"n/no-extraneous-import": [
				"error",
				{
					allowModules: ["eslint"],
				},
			],
		},
		settings: {
			"import-x/resolver": {
				typescript: {
					project: [
						"./apps/*/tsconfig.json",
						"./starters/tsconfig.json",
						"./starters/*/tsconfig.json",
						"./starters/*/tsconfig.node.json",
						"./packages/*/tsconfig.json",
						"./configs/tsconfig.json",
						"./scripts/tsconfig.json",
						"./tsconfig.json",
					],
				},
			},
		},
	},
	tseslint.configs.recommendedTypeChecked,
	{
		rules: {
			"@typescript-eslint/no-floating-promises": [
				"error",
				{
					allowForKnownSafeCalls: TEST_RUNNER_SAFE_CALLS,
				},
			],
		},
	},
	testFilesEslintConfig,
	// FIXME:
	//tseslint.configs.strictTypeChecked,
	//tseslint.configs.stylisticTypeChecked,
	eslintConfigPrettier,
]);
