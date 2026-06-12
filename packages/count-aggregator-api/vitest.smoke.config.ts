import {loadEnv} from "vite";
import {defineConfig} from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		include: ["src/**/*.live.test.ts"],
		env: loadEnv("test", process.cwd(), ""),
	},
});
