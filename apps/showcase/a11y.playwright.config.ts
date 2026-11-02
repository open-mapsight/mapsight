import {defineConfig} from "@playwright/test";

export default defineConfig({
	testDir: ".",
	testMatch: "a11y.spec.ts",
	timeout: 600_000,
	workers: 1,
	forbidOnly: Boolean(process.env.CI),
	reporter: "list",
	use: {baseURL: "http://127.0.0.1:5174"},
	webServer: {
		command: "node scripts/serve-static.mts --port 5174 --audit-tiles",
		url: "http://127.0.0.1:5174/ui/full",
		timeout: 30_000,
		reuseExistingServer: false,
	},
});
