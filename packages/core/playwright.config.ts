import {defineConfig} from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "list",
	use: {
		baseURL: "http://127.0.0.1:5173",
		trace: "on-first-retry",
	},
	webServer: {
		command:
			"node ./node_modules/vite/bin/vite.js --config e2e/vite.config.ts",
		url: "http://127.0.0.1:5173",
		reuseExistingServer: !process.env.CI,
	},
});
