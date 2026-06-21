import {expect, test} from "@playwright/test";

test.describe("count-aggregator showcase demo", () => {
	test("renders the stepped wizard result against the mock API", async ({
		page,
	}) => {
		await page.goto("/count-aggregator");

		await expect(
			page.getByRole("heading", {name: "Count aggregator"}),
		).toBeVisible();
		await expect(
			page.getByText("Stepped wizard wired to a mock API"),
		).toBeVisible();

		const stationSelect = page.getByRole("combobox");
		await stationSelect.fill("Example");
		await stationSelect.press("Enter");

		await page.getByRole("button", {name: "Next"}).click();

		await expect(
			page.getByRole("button", {name: "Change selection"}),
		).toBeVisible();
		await expect(page.getByText("Selected stations:")).toBeVisible();
		await expect(page.getByText("Example Counter A").first()).toBeVisible();
		await expect(page.getByText("Selected interval:")).toBeVisible();

		await expect(
			page.locator(".msp-count-aggregator svg.recharts-surface"),
		).toBeVisible();
		await expect(page.getByRole("link", {name: /csv/i})).toHaveAttribute(
			"href",
			/\/mock\/msp\/public\/count-aggregator\/bicycleSensorTotal\/values\/.+format=csv/,
		);
	});
});
