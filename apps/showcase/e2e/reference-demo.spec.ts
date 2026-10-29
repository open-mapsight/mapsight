/// <reference lib="dom" />
import {createRequire} from "node:module";

import {type Page, expect, test} from "@playwright/test";

const require = createRequire(
	new URL("../../../packages/a11y-audit/package.json", import.meta.url),
);
const axePath = require.resolve("axe-core/axe.min.js");

async function isolateRequests(page: Page, baseURL: string) {
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

async function checkReference(page: Page) {
	await page.addScriptTag({path: axePath});
	const violations = await page.evaluate(async () => {
		const axe = (
			window as unknown as {
				axe: {
					run: (context: {
						include: string[];
					}) => Promise<{violations: unknown[]}>;
				};
			}
		).axe;
		return (
			await axe.run({
				include: [".reference-demo", "body > .ReactModalPortal"],
			})
		).violations;
	});
	expect(violations).toEqual([]);
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= window.innerWidth,
		),
	).toBe(true);
	// Check the embed itself as well: outer overflow:auto can hide a broken grid.
	const overflow = await page
		.locator(".reference-demo")
		.evaluate((element) =>
			Array.from(
				element.querySelectorAll(
					".ms3-wrapper, .ms3-map-row, .ms3-list-header",
				),
			).some((child) => child.scrollWidth > child.clientWidth + 1),
		);
	expect(overflow).toBe(false);
}

for (const colorScheme of ["light", "dark"] as const) {
	for (const width of [390, 1280]) {
		test(`reference task: filter, sort, search and read a place, ${colorScheme} ${width}px`, async ({
			page,
			baseURL,
		}) => {
			await page.emulateMedia({colorScheme, reducedMotion: "reduce"});
			await page.setViewportSize({width, height: 1000});
			const outside = await isolateRequests(page, baseURL!);
			await page.goto("/ui/combined-list");
			await expect(
				page.getByRole("heading", {name: "Orte entdecken."}),
			).toBeVisible();
			const items = page.locator(".ms3-list__item");
			await expect(items).toHaveCount(6);
			await checkReference(page);

			const parks = page
				.locator(".ms3-marginal--left")
				.getByRole("checkbox", {name: /^Parks/});
			await parks.click();
			await expect(parks).not.toBeChecked();
			await expect(items).toHaveCount(3);
			await expect(items.filter({hasText: "Riverside Park"})).toHaveCount(
				0,
			);
			await parks.click();
			await expect(items).toHaveCount(6);

			await page.locator(".ms3-features-sorting > button").click();
			const sorting = page.locator(".ms3-features-sorting select");
			await expect(sorting).toBeVisible();
			expect(
				(await sorting.boundingBox())!.height,
			).toBeGreaterThanOrEqual(44);
			await checkReference(page);
			await sorting.selectOption("center");
			await expect(items.first()).toContainText("Central Gardens");
			await page.keyboard.press("Escape");
			await expect(sorting).not.toBeVisible();

			const resultButtons = page.locator(".ms3-list__button");
			await resultButtons.first().focus();
			await page.keyboard.press("ArrowDown");
			await expect(resultButtons.nth(1)).toBeFocused();
			const search = page.getByRole("searchbox", {
				name: "In Liste suchen …",
			});
			await search.fill("Corner");
			await expect(items).toHaveCount(1);
			await expect(items.first()).toContainText("Corner Cafe");
			await resultButtons.first().focus();
			await page.keyboard.press("Enter");
			await expect(
				page.locator(".ms3-feature-selection-info__content"),
			).toContainText("Cozy neighborhood cafe with outdoor seating.");
			if (width < 768) {
				await expect(page.locator(".ms3-wrapper")).toHaveClass(
					/ms3-wrapper--mapOnly/,
				);
				await expect(page.locator(".ms3-wrapper")).toHaveAttribute(
					"role",
					"dialog",
				);
			}
			await checkReference(page);

			// Both the desktop layer popover and mobile layer dialog remain readable.
			await page.locator(".ms3-map-overlay__button--layers").click();
			await expect(
				page.locator(".reference-demo__dialog[open]").first(),
			).toBeVisible();
			await expect(
				page.getByRole("button", {name: "Kartenthemen schließen"}),
			).toBeFocused();
			await checkReference(page);
			await page.keyboard.press("Escape");
			await expect(
				page.locator(".reference-demo__dialog[open]"),
			).toHaveCount(0);
			if (width < 768) {
				await page
					.getByRole("button", {name: "Kartenquellen öffnen"})
					.click();
				await expect(
					page.getByRole("dialog", {
						name: "Kartenquellen",
						exact: true,
					}),
				).toBeVisible();
				await checkReference(page);
				await page.keyboard.press("Escape");
				await expect(page.locator(".ms3-wrapper")).toHaveClass(
					/ms3-wrapper--mapOnly/,
				);
				await page
					.locator(
						".ms3-map-overlay__button--mobile-view-toggle--mapOnly",
					)
					.click();
				await expect(page.locator(".ms3-wrapper")).toHaveClass(
					/ms3-wrapper--mobile/,
				);
			}
			await page
				.locator(".ms3-query-input-with-label__reset-button")
				.click();
			await expect(search).toBeFocused();
			await expect(items).toHaveCount(6);
			expect(outside).toEqual([]);
		});
	}
}

test("reference appearance stays local and leaves the Full baseline unchanged after navigation", async ({
	page,
	baseURL,
}) => {
	await isolateRequests(page, baseURL!);
	await page.goto("/ui/full");
	await expect(page.locator(".ms3-list__item").first()).toBeVisible();
	const baseline = async () =>
		page.locator(".ms3-wrapper").evaluate((element) => {
			const styles = getComputedStyle(element);
			const icon = getComputedStyle(
				element.querySelector(
					".ms3-map-overlay__button--zoom--zoomIn",
				)!,
				"::before",
			);
			return {
				background: styles.backgroundColor,
				fontSize: styles.fontSize,
				fontFamily: styles.fontFamily,
				action: styles.getPropertyValue("--ms3-theme-color-a").trim(),
				iconMask: icon.maskImage,
			};
		});
	const before = await baseline();
	expect(before.action).toBe("#0e78ad");
	expect(before.iconMask).toBe("none");
	await page.locator('a[href="/ui/combined-list"]').first().click();
	await expect(page.locator(".reference-demo")).toBeVisible();
	const appearance = page.getByLabel("Darstellung dieser Demo");
	await appearance.selectOption("dark");
	await expect(page.locator(".reference-demo")).toHaveCSS(
		"color-scheme",
		"dark",
	);
	await expect(page.locator(".ms3-wrapper")).toHaveCSS(
		"background-color",
		"rgb(20, 32, 43)",
	);
	await appearance.selectOption("light");
	await expect(page.locator(".reference-demo")).toHaveCSS(
		"color-scheme",
		"light",
	);
	await checkReference(page);
	await page.locator('a[href="/ui/full"]').first().click();
	await expect(page.locator(".ms3-list__item").first()).toBeVisible();
	await expect(page.locator(".reference-demo")).toHaveCount(0);
	expect(await baseline()).toEqual(before);
});
