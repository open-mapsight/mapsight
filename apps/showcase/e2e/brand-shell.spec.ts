import {expect, test} from "@playwright/test";

for (const width of [320, 360, 768, 1280]) {
	test(`header geometry stays stable when the current nav item changes at ${width}px`, async ({
		page,
	}) => {
		await page.setViewportSize({width, height: 900});
		await page.goto("/");
		const header = page.locator(".msb-site-header");
		await expect(header).toBeVisible();
		await page.evaluate(() => document.fonts.ready);
		const geometry = () =>
			header.evaluate((element) => {
				const box = (node: Element) => {
					const {x, y, width, height} = node.getBoundingClientRect();
					return {x, y, width, height};
				};
				return {
					logo: box(element.querySelector("img")!),
					links: [...element.querySelectorAll("nav a")].map(box),
					header: box(element),
				};
			});
		const before = await geometry();
		await header.locator("nav a").evaluateAll((links) => {
			for (const link of links) link.removeAttribute("aria-current");
		});
		for (const link of await header.locator("nav a").all()) {
			await link.evaluate((element) =>
				element.setAttribute("aria-current", "page"),
			);
			expect(await geometry()).toEqual(before);
			await link.evaluate((element) =>
				element.removeAttribute("aria-current"),
			);
		}
		await page.getByRole("button", {name: "Dark mode"}).click();
		expect(await geometry()).toEqual(before);
		expect(
			await page
				.locator("html")
				.evaluate((element) => element.scrollWidth),
		).toBe(width);
		await page.goto("/scenarios/index.html");
		await expect(header).toBeVisible();
		await page.evaluate(() => document.fonts.ready);
		expect(await geometry()).toEqual(before);
	});
}

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
		page.getByRole("heading", {name: "Try Mapsight in context."}),
	).toBeVisible();
	await expect(
		page.getByRole("link", {name: "Mapsight Showcase", exact: true}),
	).toBeVisible();
	await expect(
		page.getByRole("link", {name: "Explore scenarios", exact: true}),
	).toHaveAttribute("href", "/scenarios/index.html");
	await page.keyboard.press("Tab");
	await expect(
		page.getByRole("link", {name: "Skip to content"}),
	).toBeFocused();
	await page.keyboard.press("Enter");
	await expect(page.locator("#showcase-content")).toBeFocused();
	for (const name of [
		"Home",
		"Scenarios",
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

test.describe("with the OS in dark mode", () => {
	test.use({colorScheme: "dark"});

	test("the brand frame starts dark and the toggle still wins", async ({
		page,
	}) => {
		await page.goto("/");
		const toggle = page.getByRole("button", {name: "Dark mode"});
		await expect(toggle).toHaveAttribute("aria-pressed", "true");
		await expect(page.locator(".msb-shell")).toHaveAttribute(
			"data-theme",
			"dark",
		);
		await toggle.click();
		await expect(page.locator(".msb-shell")).toHaveAttribute(
			"data-theme",
			"light",
		);
	});
});

test("Demos stays active across UI routes", async ({page}) => {
	await page.route("https://**/*", (route) => route.abort());
	await page.goto("/ui/simple-map");
	await expect(
		page
			.getByRole("navigation", {name: "Main", exact: true})
			.getByRole("link", {name: "Demos", exact: true}),
	).toHaveAttribute("aria-current", "page");
});

test("home opens the standalone scenarios overview and its brand links return to the showcase", async ({
	page,
}) => {
	await page.goto("/");
	await page
		.getByRole("link", {name: "Explore scenarios", exact: true})
		.click();
	await expect(page).toHaveURL(/\/scenarios\/index\.html$/);
	await expect(
		page.getByRole("heading", {name: "Maps within a real task."}),
	).toBeVisible();
	await expect(
		page
			.getByRole("navigation", {name: "Main", exact: true})
			.getByRole("link", {name: "Scenarios", exact: true}),
	).toHaveAttribute("aria-current", "page");
	await page
		.getByRole("link", {name: "Mapsight Showcase", exact: true})
		.click();
	await expect(
		page.getByRole("heading", {name: "Try Mapsight in context."}),
	).toBeVisible();
});
