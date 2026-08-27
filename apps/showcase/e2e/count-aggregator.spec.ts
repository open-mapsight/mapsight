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
			page.getByText(
				/embeddable reporting flow for public time series data/i,
			),
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

	test("headless demo loads values with host-owned UI", async ({page}) => {
		await page.goto("/count-aggregator/headless");

		await expect(
			page.getByRole("heading", {name: "Count aggregator (headless)"}),
		).toBeVisible();
		await expect(
			page.getByText(/@mapsight\/count-aggregator-ui\/headless/),
		).toBeVisible();

		const firstStation = page
			.locator(".count-aggregator-headless__station-list label")
			.first();
		await expect(firstStation).toBeVisible();
		await firstStation.click();

		await page.getByRole("button", {name: "Load daily values"}).click();

		await expect(
			page.locator(".count-aggregator-headless__table tbody tr").first(),
		).toBeVisible();
	});
});
