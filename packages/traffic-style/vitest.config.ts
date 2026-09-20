import {defineConfig} from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		isolate: false,
		fsModuleCache: true,
		include: [
			"src/lib/*.test.ts",
			"src/lib/icon/**/*.test.ts",
			"src/lib/pictograms/**/*.test.ts",
			"src/lib/runtime/**/*.test.ts",
			"scripts/*.test.ts",
			"scripts/lib/**/*.test.ts",
		],
	},
});
