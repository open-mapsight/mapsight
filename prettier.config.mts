import {type Config} from "prettier";

const config: Config = {
	plugins: ["@trivago/prettier-plugin-sort-imports"],
	bracketSpacing: false,
	useTabs: true,
	tabWidth: 4,
	importOrder: [
		"<BUILTIN_MODULES>",
		"^react(.*)$",
		"^next(.*)$",
		"^ol/(.*)$",
		"<THIRD_PARTY_MODULES>",
		"^@mapsight/core(.*)$",
		"^@mapsight/lib-(.*)$",
		"^@/.+$",
		"^[./]",
		"^\\.",
	],
	importOrderSeparation: true,
	importOrderSortSpecifiers: true,
	importOrderSideEffects: false,
	overrides: [
		{
			files: ["*.yaml", "*.yml"],
			options: {
				useTabs: false,
				tabWidth: 2,
			},
		},
		{
			files: ["*.source.js"],
			options: {
				importOrder: [],
				importOrderSeparation: false,
				importOrderSortSpecifiers: false,
			},
		},
	],
};

export default config;
