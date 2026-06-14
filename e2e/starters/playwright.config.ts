import {defineConfig, devices} from "@playwright/test";

const hostPort = 5191;
const nextPort = 3100;
const spaPort = 4191;

export default defineConfig({
	testDir: ".",
	fullyParallel: false,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: "list",
	use: {
		trace: "on-first-retry",
	},
	webServer: [
		{
			command: `pnpm --filter mapsight-host-starter exec vite --host 127.0.0.1 --port ${hostPort} --strictPort`,
			url: `http://127.0.0.1:${hostPort}`,
			reuseExistingServer: !process.env.CI,
			timeout: 120_000,
		},
		{
			command: `pnpm --filter mapsight-next-starter exec next start -H 127.0.0.1 -p ${nextPort}`,
			url: `http://127.0.0.1:${nextPort}`,
			reuseExistingServer: !process.env.CI,
			timeout: 120_000,
		},
		{
			command: `pnpm --filter mapsight-vite-spa-starter exec vite preview --host 127.0.0.1 --port ${spaPort} --strictPort`,
			url: `http://127.0.0.1:${spaPort}`,
			reuseExistingServer: !process.env.CI,
			timeout: 120_000,
		},
	],
	projects: [
		{
			name: "host",
			testMatch: "host.spec.ts",
			use: {
				...devices["Desktop Chrome"],
				baseURL: `http://127.0.0.1:${hostPort}`,
			},
		},
		{
			name: "next",
			testMatch: "next.spec.ts",
			use: {
				...devices["Desktop Chrome"],
				baseURL: `http://127.0.0.1:${nextPort}`,
			},
		},
		{
			name: "vite-spa",
			testMatch: "vite-spa.spec.ts",
			use: {
				...devices["Desktop Chrome"],
				baseURL: `http://127.0.0.1:${spaPort}`,
			},
		},
	],
});
