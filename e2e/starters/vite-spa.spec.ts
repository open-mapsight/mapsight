import {expect, test} from "@playwright/test";

test("home route mounts Mapsight map UI", async ({page}) => {
	await page.goto("/");
	await expect(page.locator(".ol-viewport")).toBeVisible({
		timeout: 30_000,
	});
});

test("about route has no map", async ({page}) => {
	await page.goto("/about");
	await expect(page.getByRole("heading", {name: "About"})).toBeVisible();
	await expect(page.locator(".ol-viewport")).toHaveCount(0);
});
