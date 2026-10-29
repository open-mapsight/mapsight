import {expect, test} from "@playwright/test";

test("combined list uses the deployed same-origin tile endpoint", async ({
	page,
}) => {
	test.skip(
		process.env.VITE_SHOWCASE_OSM_TILE_URL !== "/tiles/osm/{z}/{x}/{y}.png",
		"Requires the same-origin showcase build setting",
	);
	const tileRequests: string[] = [];
	// Stub BOTH sources so this regression test can never fetch an upstream tile.
	await page.route(
		/\/tiles\/osm\/|https:\/\/tile\.openstreetmap\.org\//,
		async (route) => {
			tileRequests.push(route.request().url());
			await route.fulfill({status: 204});
		},
	);
	await page.goto("/ui/combined-list");
	await expect.poll(() => tileRequests.length).toBeGreaterThan(0);
	const origin = new URL(page.url()).origin;
	expect(
		tileRequests.every((url) => url.startsWith(`${origin}/tiles/osm/`)),
	).toBe(true);
	await expect(
		page
			.locator(
				'a[href="https://www.openstreetmap.org/copyright"]:visible',
			)
			.first(),
	).toBeVisible();
});
