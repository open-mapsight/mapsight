import {importX} from "eslint-plugin-import-x";
import jsxA11y from "eslint-plugin-jsx-a11y";
import pluginReact from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import {defineConfig} from "eslint/config";

import baseConfig, {
	TEST_FILE_GLOBS,
	testFilesEslintConfig,
} from "./eslint-config-base.mts";

export {TEST_FILE_GLOBS, testFilesEslintConfig} from "./eslint-config-base.mts";

export default defineConfig([
	baseConfig,
	importX.flatConfigs.react,
	pluginReact.configs.flat.recommended!,
	pluginReact.configs.flat["jsx-runtime"]!,
	reactHooks.configs.flat.recommended,
	jsxA11y.flatConfigs.recommended,
	{
		settings: {
			react: {
				version: "18",
			},
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
