/// <reference lib="dom" />
import {mkdir} from "node:fs/promises";
import {createRequire} from "node:module";

import {type Page, expect, test} from "@playwright/test";

const require = createRequire(
	new URL("../../../../packages/a11y-audit/package.json", import.meta.url),
);
const axePath = require.resolve("axe-core/axe.min.js");
const screenshots = process.env.SCENARIO_SCREENSHOTS;

async function sameOrigin(page: Page, baseURL: string) {
	const outside: string[] = [];
	await page.route("**/*", async (route) => {
		const url = new URL(route.request().url());
		if (url.origin !== new URL(baseURL).origin) {
			outside.push(url.href);
			await route.abort();
		} else if (url.pathname.startsWith("/tiles/osm/")) {
			await route.fulfill({status: 204});
		} else {
			await route.continue();
		}
	});
	return outside;
}

async function audit(page: Page) {
	await page.addScriptTag({path: axePath});
	const violations = await page.evaluate(async () =>
		(
			window as unknown as {
				axe: {run: () => Promise<{violations: unknown[]}>};
			}
		).axe.run(),
	);
	expect(violations.violations).toEqual([]);
}

for (const colorScheme of ["light", "dark"] as const) {
	for (const width of [360, 768, 1280]) {
		test(`tourism ${colorScheme} at ${width}px: native composition and accessible theme`, async ({
			page,
			baseURL,
		}) => {
			await page.emulateMedia({colorScheme});
			await page.setViewportSize({width, height: 900});
			const outside = await sameOrigin(page, baseURL!);
			await page.goto("/scenarios/tourismus/index.html");
			await expect(page.locator("html")).toHaveAttribute("lang", "de");
			await expect(page.getByRole("heading", {level: 1})).toContainText(
				"Mal kurz raus.",
			);
			await expect(page.locator(".place-card")).toHaveCount(8);
			await expect(page.locator(".ol-viewport")).toBeVisible();
			await expect(
				page.getByRole("complementary", {name: "Demohinweis"}),
			).toContainText("Fiktiver Tourismushost");
			expect(
				await page
					.locator('link[href*="kern"], link[href*="global.css"]')
					.count(),
			).toBe(0);
			await expect(
				page.getByRole("checkbox", {name: /Museen/}),
			).toBeVisible();
			const accent = await page
				.locator(".discover-link")
				.evaluate((element) => getComputedStyle(element).color);
			const icon = await page
				.locator(".ms3-map-overlay__button--zoom--zoomIn")
				.evaluate((element) => ({
					color: getComputedStyle(element, "::before")
						.backgroundColor,
					mask: getComputedStyle(element, "::before").maskImage,
				}));
			expect(icon.color).toBe(accent);
			expect(icon.mask).not.toBe("none");
			await audit(page);
			if (screenshots) {
				await mkdir(screenshots, {recursive: true});
				await page.screenshot({
					path: `${screenshots}/tourismus-${width}-${colorScheme}.png`,
					fullPage: true,
				});
			}
			await page.locator(".place-card button").first().click();
			await expect(
				page.locator("#place-details .ms3-feature-selection-info"),
			).toBeVisible();
			await expect(
				page.getByText("Vor deinem Besuch", {exact: true}),
			).toBeVisible();
			await expect(page.locator(".outbound-note")).toContainText(
				"externe Website",
			);
			await audit(page);
			if (screenshots)
				await page.screenshot({
					path: `${screenshots}/tourismus-${width}-${colorScheme}-selected.png`,
					fullPage: true,
				});
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

test("tourist task: filter, compare distance, read, share and reopen details", async ({
	page,
	baseURL,
}) => {
	const outside = await sameOrigin(page, baseURL!);
	await page.goto("/scenarios/tourismus/index.html");
	await expect(page.locator(".place-card")).toHaveCount(8);
	await page.locator(".ms3-features-sorting > button").click();
	await page.locator(".ms3-features-sorting select").selectOption("park");
	await page.keyboard.press("Escape");
	await expect(page.locator(".place-card button").first()).toHaveText(
		"Theaterpark",
	);
	await page.getByRole("checkbox", {name: /Museen/}).click();
	await expect(page.locator(".place-card")).toHaveCount(2);
	await page.locator(".place-card button").first().click();
	await expect(
		page.getByText("Vor deinem Besuch", {exact: true}),
	).toBeVisible();
	await page.locator(".ms3-place-actions__share-button").click();
	const dialog = page.getByRole("dialog", {name: "Link teilen"});
	await expect(dialog).toBeVisible();
	const permalink = await dialog.locator("a").getAttribute("href");
	expect(permalink).toContain("feature=osm-node-");
	await page.goto(permalink!);
	await expect(
		page.getByText("Vor deinem Besuch", {exact: true}),
	).toBeVisible();
	await page.locator(".ms3-place-actions__navigate-button").click();
	const external = page.getByRole("link", {
		name: "OpenStreetMap (externe Website)",
		exact: true,
	});
	await expect(external).toHaveAttribute(
		"href",
		/^https:\/\/www\.openstreetmap\.org\/directions\?to=/,
	);
	await page.keyboard.press("Escape");
	await page.getByRole("link", {name: "Open English version"}).click();
	await expect(page.locator("html")).toHaveAttribute("lang", "en");
	await expect(page.getByRole("heading", {level: 1})).toContainText(
		"A little escape.",
	);
	await expect(page.getByText("Before you go", {exact: true})).toBeVisible();
	await expect(
		page.locator(".ms3-place-actions__share-button"),
	).toHaveAccessibleName("Share this place");
	await audit(page);
	expect(outside).toEqual([]);
});
