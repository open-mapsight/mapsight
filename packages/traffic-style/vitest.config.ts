import {defineConfig} from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		include: [
			"src/lib/icon/**/*.test.ts",
			"src/lib/pictograms/**/*.test.ts",
			"src/lib/runtime/**/*.test.ts",
			"scripts/lib/**/*.test.ts",
		],
	},
});
