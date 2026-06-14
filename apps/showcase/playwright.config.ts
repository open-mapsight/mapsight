import {defineConfig} from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "list",
	use: {
		baseURL: "http://localhost:5173",
		trace: "on-first-retry",
	},
	webServer: {
		command: "pnpm dev",
		timeout: 120_000,
		url: "http://localhost:5173/count-aggregator",
		reuseExistingServer: !process.env.CI,
	},
});
