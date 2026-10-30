/// <reference lib="dom" />
import {mkdir} from "node:fs/promises";
import {createRequire} from "node:module";

import {expect, test} from "@playwright/test";

const require = createRequire(
	new URL("../../../packages/a11y-audit/package.json", import.meta.url),
);
const axePath = require.resolve("axe-core/axe.min.js");
const output = process.env.SCENARIO_SCREENSHOTS;

for (const colorScheme of ["light", "dark"] as const) {
	for (const width of [360, 1280]) {
		test(`traffic task ${colorScheme} at ${width}px: period, simulation, layers and counter chart`, async ({
			page,
			baseURL,
		}) => {
			await page.emulateMedia({colorScheme});
			await page.setViewportSize({width, height: 900});
			const outside: string[] = [];
			await page.route("**/*", async (route) => {
				const url = new URL(route.request().url());
				if (url.origin !== new URL(baseURL!).origin) {
					outside.push(url.href);
					await route.abort();
				} else if (url.pathname.startsWith("/tiles/osm/")) {
					await route.fulfill({status: 204});
				} else {
					await route.continue();
				}
			});
			await page.goto("/scenarios/verkehr/index.html");
			await expect(page).toHaveTitle(
				"Verkehrszentrale Musterregion · fiktive Demo",
			);
			await expect(
				page.getByRole("heading", {
					name: "Die Lage im Blick.",
					exact: true,
				}),
			).toBeVisible();
			await expect(
				page.getByText("Simulation · kein Livebetrieb"),
			).toBeVisible();
			await expect(page.locator(".ol-viewport")).toBeVisible();
			const results = page.getByRole("region", {
				name: "Meldungen und Standorte",
				exact: true,
			});
			const entries = results.locator(".ms3-list__item");
			await expect(entries).toHaveCount(6);
			await expect(page.getByTestId("incident-count")).toHaveText("2");
			await expect(page.getByTestId("free-spaces")).toHaveText("128");
			await expect(
				results.getByText("48 von 180 Plätzen frei · simuliert"),
			).toBeVisible();

			await page
				.getByRole("combobox", {name: "Zeitraum", exact: true})
				.selectOption("week");
			await expect(page.getByTestId("incident-count")).toHaveText("3");
			await expect(entries).toHaveCount(7);
			await expect(
				results.getByText("Musterbrücke · Geplante Arbeiten", {
					exact: true,
				}),
			).toBeVisible();
			await page
				.getByRole("button", {
					name: "Nächsten Demo-Stand zeigen",
					exact: true,
				})
				.click();
			await expect(
				page.locator(".traffic-controls").getByRole("status"),
			).toContainText("09:15 Uhr");
			await expect(page.getByTestId("free-spaces")).toHaveText("132");
			await expect(
				results.getByText("34 von 180 Plätzen frei · simuliert"),
			).toBeVisible();

			const incidents = page.getByRole("checkbox", {
				name: /^Verkehrsmeldungen,/,
			});
			await expect(incidents).toBeChecked();
			await incidents.click();
			await expect(incidents).not.toBeChecked();
			await expect(entries).toHaveCount(4);
			await expect(
				results.getByText("Musterbrücke · Geplante Arbeiten", {
					exact: true,
				}),
			).toHaveCount(0);
			// Summary values continue to describe the complete dataset, as the host explains.
			await expect(page.getByTestId("incident-count")).toHaveText("3");
			await expect(page.getByTestId("free-spaces")).toHaveText("132");

			await results
				.getByRole("button", {name: /Zählstelle Musterufer/})
				.click();
			const details = page.getByRole("region", {
				name: "Details zum ausgewählten Eintrag",
				exact: true,
			});
			await expect(
				details.getByRole("heading", {
					name: "Zählstelle Musterufer",
					exact: true,
				}),
			).toBeVisible();
			await expect(
				details.getByText("Radverkehr · Demodaten", {exact: true}),
			).toBeVisible();
			await expect(details.locator(".recharts-surface")).toBeVisible();
			await expect(
				details.locator(".recharts-area-curve, .recharts-line-curve"),
			).toHaveCount(1);
			if (process.env.SHOWCASE_TEST_STATIC) {
				expect(
					await page.evaluate(() =>
						// eslint-disable-next-line n/no-unsupported-features/node-builtins -- This callback runs in the browser.
						Boolean(window.navigator.serviceWorker.controller),
					),
				).toBe(true);
			}

			await page.addScriptTag({path: axePath});
			const violations = await page.evaluate(async () => {
				const axe = (
					window as unknown as {
						axe: {run: () => Promise<{violations: unknown[]}>};
					}
				).axe;
				return (await axe.run()).violations;
			});
			expect(violations).toEqual([]);
			expect(
				await page.evaluate(
					() =>
						document.documentElement.scrollWidth <=
						window.innerWidth,
				),
			).toBe(true);
			expect(outside).toEqual([]);
			if (output) {
				await mkdir(output, {recursive: true});
				await page.screenshot({
					path: `${output}/verkehr-${width}-${colorScheme}-selected.png`,
					fullPage: true,
				});
			}
		});
	}
}
