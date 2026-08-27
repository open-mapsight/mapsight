import {defineConfig} from "vitest/config";

export default defineConfig({
	test: {
		include: ["src/js/**/*.test.ts"],
		environment: "jsdom",
		setupFiles: ["src/js/test/setup-dom.ts"],
	},
});
