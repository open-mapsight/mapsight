import {defineConfig} from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		include: ["src/**/*.test.ts"],
		setupFiles: ["src/install-ol-node-env.ts"],
	},
});
