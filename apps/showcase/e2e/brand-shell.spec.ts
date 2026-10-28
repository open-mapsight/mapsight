import {expect, test} from "@playwright/test";

test("brand theme switches the logo without changing product typography or roles", async ({
	page,
}) => {
	await page.route("https://**/*", (route) => route.abort());
	await page.goto("/ui/combined-list");
	const product = page.locator(".ms3-wrapper").first();
	await expect(product).toBeVisible();
	const styles = () =>
		product.evaluate((element) => {
			const style =
				element.ownerDocument.defaultView!.getComputedStyle(element);
			return {
				font: style.font,
				color: style.color,
				background: style.backgroundColor,
				roles: Array.from({length: style.length}, (_, index) =>
					style.item(index),
				)
					.filter((key) => key.startsWith("--ms3-"))
					.map((key) => [key, style.getPropertyValue(key)]),
			};
		});
	const before = await styles();
	const logo = page.getByRole("img", {name: "Mapsight", exact: true});
	const lightLogo = await logo.getAttribute("src");
	const toggle = page.getByRole("button", {name: "Dark mode"});
	await toggle.click();
	await expect(toggle).toHaveAttribute("aria-pressed", "true");
	expect(await logo.getAttribute("src")).not.toBe(lightLogo);
	expect(await styles()).toEqual(before);
	await page.reload();
	await expect(toggle).toHaveAttribute("aria-pressed", "false");
});

test("narrow navigation wraps and the skip link focuses the content", async ({
	page,
}) => {
	await page.setViewportSize({width: 360, height: 800});
	await page.goto("/");
	await expect(
		page.getByRole("heading", {name: "Maps that fit your site."}),
	).toBeVisible();
	await page.keyboard.press("Tab");
	await expect(
		page.getByRole("link", {name: "Skip to content"}),
	).toBeFocused();
	await page.keyboard.press("Enter");
	await expect(page.locator("#showcase-content")).toBeFocused();
	for (const name of [
		"Home",
		"Demos",
		"Count aggregator",
		"Icons",
		"Project website ↗",
	]) {
		await expect(
			page
				.getByRole("navigation", {name: "Main", exact: true})
				.getByRole("link", {name, exact: true}),
		).toBeVisible();
	}
	expect(
		await page.locator("html").evaluate((element) => element.scrollWidth),
	).toBe(360);
});
