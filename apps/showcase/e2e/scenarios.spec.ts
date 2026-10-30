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
	for (const width of [360, 768, 1280]) {
		for (const name of ["overview", "verwaltung"]) {
			test(`${name} ${colorScheme} at ${width}px: static document, same-origin assets and axe`, async ({
				page,
				baseURL,
			}) => {
				await page.emulateMedia({colorScheme});
				await page.setViewportSize({width, height: 900});
				const outside: string[] = [];
				await page.route("**/*", async (route) => {
					const url = route.request().url();
					if (new URL(url).origin !== new URL(baseURL!).origin) {
						outside.push(url);
						await route.abort();
						return;
					}
					if (url.includes("/tiles/osm/")) {
						await route.fulfill({status: 204});
						return;
					}
					await route.continue();
				});
				const path =
					name === "overview"
						? "/scenarios/index.html"
						: "/scenarios/verwaltung/index.html";
				await page.goto(path);
				await expect(page.locator("h1")).toBeVisible();
				await expect(page).toHaveTitle(
					name === "overview"
						? "Scenarios · Mapsight Showcase"
						: "Musterstadt · Bürgerservice – fiktive Demo",
				);
				if (name === "overview") {
					await expect(page.locator(".msb-shell")).toBeVisible();
					await expect(
						page.locator(
							'link[href="/vendor/kern/dist/kern.min.css"]',
						),
					).toHaveCount(0);
					await expect(
						page.getByRole("link", {
							name: "Mapsight Showcase",
							exact: true,
						}),
					).toBeVisible();
					for (const scenario of [
						"verwaltung",
						"tourismus",
						"verkehr",
					]) {
						await expect(
							page.locator(
								`a[href="/scenarios/${scenario}/index.html"]`,
							),
						).toBeVisible();
					}
				} else {
					await expect(
						page.locator(
							'link[href="/vendor/kern/dist/kern.min.css"]',
						),
					).toBeAttached();
					expect(
						await page.locator('link[href*="global.css"]').count(),
					).toBe(0);
				}
				if (name === "verwaltung") {
					await expect(
						page.locator(".ms3-list__item").first(),
					).toBeVisible();
					await expect(page.locator(".ol-viewport")).toBeVisible();
					// Product surfaces and icons must resolve the host roles in either OS scheme.
					const hostBackground = await page
						.locator("body")
						.evaluate(
							(element) =>
								getComputedStyle(element).backgroundColor,
						);
					await expect(page.locator(".service-map")).toHaveCSS(
						"background-color",
						hostBackground,
					);
					await expect(page.locator(".ms3-attribution")).toHaveCSS(
						"background-color",
						hostBackground,
					);
					const hostAction = await page
						.locator(".breadcrumb a")
						.evaluate((element) => getComputedStyle(element).color);
					const zoomIcon = await page
						.locator(".ms3-map-overlay__button--zoom--zoomIn")
						.evaluate((element) => {
							const icon = getComputedStyle(element, "::before");
							return {
								color: icon.backgroundColor,
								mask: icon.maskImage,
							};
						});
					expect(zoomIcon.color).toBe(hostAction);
					expect(zoomIcon.mask).not.toBe("none");
				}
				await page.evaluate(() => document.fonts.ready);
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
				if (output) {
					await mkdir(output, {recursive: true});
					await page.screenshot({
						path: `${output}/${name}-${width}-${colorScheme}.png`,
						fullPage: true,
					});
				}
				if (name === "verwaltung") {
					await page
						.locator(".ms3-list__item button")
						.first()
						.click();
					await expect(
						page.getByText(/Öffnungszeiten: Montag/),
					).toBeVisible();
					const selectedViolations = await page.evaluate(async () => {
						const axe = (
							window as unknown as {
								axe: {
									run: () => Promise<{violations: unknown[]}>;
								};
							}
						).axe;
						return (await axe.run()).violations;
					});
					expect(selectedViolations).toEqual([]);
					if (output) {
						await mkdir(output, {recursive: true});
						await page.screenshot({
							path: `${output}/${name}-${width}-${colorScheme}-selected.png`,
							fullPage: true,
						});
					}
					await page
						.locator(".ms3-query-input-with-label__open")
						.click();
					const search = page.locator(
						".ms3-query-input-with-label__input",
					);
					await expect(search).toBeFocused();
					await search.fill("Muster");
					await page.keyboard.press("Tab");
					await page.keyboard.press("Shift+Tab");
					await expect(search).toBeFocused();
					const searchViolations = await page.evaluate(async () => {
						const axe = (
							window as unknown as {
								axe: {
									run: () => Promise<{violations: unknown[]}>;
								};
							}
						).axe;
						return (await axe.run()).violations;
					});
					expect(searchViolations).toEqual([]);
					if (output) {
						await page.screenshot({
							path: `${output}/${name}-${width}-${colorScheme}-search.png`,
							fullPage: true,
						});
					}
				}
				expect(outside).toEqual([]);
				expect(
					await page.evaluate(
						() =>
							document.documentElement.scrollWidth <=
							window.innerWidth,
					),
				).toBe(true);
			});
		}
	}
}

test("citizen task: filter stufenlos, select a service, read opening hours", async ({
	page,
	baseURL,
}) => {
	await page.route("**/*", async (route) => {
		const url = new URL(route.request().url());
		if (url.origin !== new URL(baseURL!).origin) {
			await route.abort();
		} else if (url.pathname.startsWith("/tiles/osm/")) {
			await route.fulfill({status: 204});
		} else {
			await route.continue();
		}
	});
	await page.goto("/scenarios/verwaltung/index.html");
	await expect(page.locator(".ms3-list__item").first()).toBeVisible();
	await page.locator(".ms3-features-sorting > button").click();
	await page.locator(".ms3-features-sorting select").selectOption("mitte");
	await expect(page.locator(".ms3-list__item").first()).toContainText(
		"Servicestelle Mustermitte 05",
	);
	await page.getByRole("checkbox", {name: /Stufenlos/}).click();
	await page.locator(".ms3-list__item button").first().click();
	await expect(page.getByText(/Öffnungszeiten: Montag/)).toBeVisible();
	await page.goto(
		"/scenarios/verwaltung/index.html?feature=muster-service-01",
	);
	await expect(page.getByText(/Öffnungszeiten: Montag/)).toBeVisible();
});
