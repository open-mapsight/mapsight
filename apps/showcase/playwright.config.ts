import {defineConfig} from "@playwright/test";

const staticBuild = Boolean(process.env.SHOWCASE_TEST_STATIC);
const baseURL =
	process.env.SHOWCASE_TEST_URL ??
	(staticBuild ? "http://127.0.0.1:5174" : "http://localhost:5173");

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "list",
	use: {
		baseURL,
		trace: "on-first-retry",
	},
	webServer: process.env.SHOWCASE_TEST_URL
		? undefined
		: {
				command: staticBuild
					? "pnpm exec vite preview --host 127.0.0.1 --port 5174"
					: "pnpm dev",
				timeout: 120_000,
				url: `${baseURL}/count-aggregator`,
				reuseExistingServer: !process.env.CI && !staticBuild,
			},
});
