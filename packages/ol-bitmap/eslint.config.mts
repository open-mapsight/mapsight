import {defineConfig} from "eslint/config";

import baseConfig, {
	testFilesEslintConfig,
} from "../../configs/eslint-config-base.mts";

export default defineConfig([baseConfig, testFilesEslintConfig]);
