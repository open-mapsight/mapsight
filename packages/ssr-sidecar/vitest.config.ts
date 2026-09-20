import {defineConfig} from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		isolate: false,
		fsModuleCache: true,
		include: ["src/**/*.test.ts"],
	},
});
