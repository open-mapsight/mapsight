import {expect, test} from "@playwright/test";

for (const width of [390, 1280]) {
	test(`home route hydrates at ${width}px without React recovery`, async ({
		page,
	}) => {
		const hydrationErrors: string[] = [];
		const recordHydrationError = (message: string) => {
			if (
				/hydration|didn't match|did not match|Minified React error #4(?:18|23|25)/i.test(
					message,
				)
			) {
				hydrationErrors.push(message);
			}
		};
		page.on("pageerror", (error) => recordHydrationError(error.message));
		page.on("console", (message) => {
			if (message.type() === "error")
				recordHydrationError(message.text());
		});
		await page.setViewportSize({width, height: 900});
		await page.goto("/");
		await expect(page.locator(".ol-viewport")).toBeVisible({
			timeout: 30_000,
		});
		await expect(page.locator(".ms3-wrapper")).toHaveClass(
			new RegExp(`ms3-wrapper--${width < 768 ? "mobile" : "desktop"}`),
		);
		expect(hydrationErrors).toEqual([]);
	});
}

test("about route has no map", async ({page}) => {
	await page.goto("/about");
	await expect(page.getByRole("heading", {name: "About"})).toBeVisible();
	await expect(page.locator(".ol-viewport")).toHaveCount(0);
});
