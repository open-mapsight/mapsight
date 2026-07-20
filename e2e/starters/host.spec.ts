// CI timing probe — safe to delete with the bench PR
import {expect, test} from "@playwright/test";

test("host dev page mounts an OpenLayers map", async ({page}) => {
	await page.goto("/");
	await expect(page.locator(".mapsight-embed .ol-viewport")).toBeVisible({
		timeout: 30_000,
	});
});
