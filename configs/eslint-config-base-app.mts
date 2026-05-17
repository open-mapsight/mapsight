import {importX} from "eslint-plugin-import-x";
import pluginReact from "eslint-plugin-react";
import {defineConfig} from "eslint/config";

import baseConfig from "./eslint-config-base-react.mts";

export default defineConfig([
	...baseConfig,
	importX.flatConfigs.react,
	pluginReact.configs.flat.recommended!,
	pluginReact.configs.flat["jsx-runtime"]!,
	{
		name: "custom",
		rules: {
			"import-x/extensions": "off",
		},
	},
]);
