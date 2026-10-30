import {defineConfig} from "vitest/config";

// Needs a Playwright Chromium: `pnpm exec playwright install chromium`.
export default defineConfig({
	test: {
		environment: "node",
		include: ["src/**/*.e2e.test.ts"],
		testTimeout: 180_000,
		hookTimeout: 180_000,
	},
});
