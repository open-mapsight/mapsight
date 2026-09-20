import {defineConfig} from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		isolate: false,
		fsModuleCache: true,
		exclude: ["**/node_modules/**", "**/dist/**", "**/*.live.test.ts"],
	},
});
