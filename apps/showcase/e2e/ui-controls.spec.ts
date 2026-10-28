import {expect, test} from "@playwright/test";

test("mobile sorting select meets the minimum target height", async ({
	page,
}) => {
	await page.setViewportSize({width: 390, height: 844});
	await page.goto("/ui/full");
	await page.locator(".ms3-features-sorting button").click();
	const select = page.locator(".ms3-features-sorting select");
	await expect(select).toBeVisible();
	const bounds = await select.boundingBox();
	expect(bounds?.height).toBeGreaterThanOrEqual(24);
});
