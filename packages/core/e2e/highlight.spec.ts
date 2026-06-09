import {expect, test} from "@playwright/test";

const HIGHLIGHT_TEST_FEATURE_ID = "poi-1";

type ClientPoint = {x: number; y: number};

async function waitForHighlightTest(page: import("@playwright/test").Page) {
	await page.goto("/");
	await page.waitForFunction(
		() => window.__mapsightHighlightTest?.ready === true,
	);
	return page.evaluate(() => ({
		center: window.__mapsightHighlightTest!.centerClientPosition(),
		empty: window.__mapsightHighlightTest!.emptyClientPosition(),
	}));
}

async function getHighlightFeatures(page: import("@playwright/test").Page) {
	return page.evaluate(() =>
		window.__mapsightHighlightTest!.getHighlightFeatures(),
	);
}

function lerp(a: number, b: number, t: number) {
	return a + (b - a) * t;
}

function lerpPoint(from: ClientPoint, to: ClientPoint, t: number): ClientPoint {
	return {
		x: lerp(from.x, to.x, t),
		y: lerp(from.y, to.y, t),
	};
}

/** Move along a polyline with many intermediate pointer events (Playwright mouse). */
async function mouseMovePath(
	page: import("@playwright/test").Page,
	points: Array<ClientPoint>,
	stepsPerSegment = 8,
) {
	for (let i = 1; i < points.length; i++) {
		const from = points[i - 1]!;
		const to = points[i]!;
		for (let step = 1; step <= stepsPerSegment; step++) {
			const t = step / stepsPerSegment;
			const point = lerpPoint(from, to, t);
			await page.mouse.move(point.x, point.y);
		}
	}
}

test.describe("highlight on mouseover (core e2e)", () => {
	test("clears highlight in redux when the pointer leaves the feature (simple two-move)", async ({
		page,
	}) => {
		const {center} = await waitForHighlightTest(page);

		await page.mouse.move(center.x, center.y);
		await expect
			.poll(() => getHighlightFeatures(page))
			.toEqual([HIGHLIGHT_TEST_FEATURE_ID]);

		await page.mouse.move(center.x - 180, center.y - 180);
		await expect.poll(() => getHighlightFeatures(page)).toEqual([]);
	});

	test("clears highlight after a second pointermove off the feature", async ({
		page,
	}) => {
		const {center, empty} = await waitForHighlightTest(page);

		await page.mouse.move(center.x, center.y);
		await expect
			.poll(() => getHighlightFeatures(page))
			.toEqual([HIGHLIGHT_TEST_FEATURE_ID]);

		// Two moves off the feature while still outside hit tolerance.
		await page.mouse.move(empty.x, empty.y);
		await page.mouse.move(empty.x + 2, empty.y + 2);
		await page.waitForTimeout(25);
		await expect.poll(() => getHighlightFeatures(page)).toEqual([]);
	});

	test("clears highlight after many incremental moves onto and off the feature", async ({
		page,
	}) => {
		const {center, empty} = await waitForHighlightTest(page);

		for (let run = 0; run < 30; run++) {
			await mouseMovePath(page, [empty, center], 12);
			await page.waitForTimeout(25);
			expect(await getHighlightFeatures(page)).toEqual([
				HIGHLIGHT_TEST_FEATURE_ID,
			]);

			await mouseMovePath(page, [center, empty], 12);
			await page.waitForTimeout(25);
			expect(await getHighlightFeatures(page)).toEqual([]);
		}
	});

	test("clears highlight after jittery moves around the feature edge", async ({
		page,
	}) => {
		const {center, empty} = await waitForHighlightTest(page);

		// Oscillate near the feature center (within/outside default hitTolerance).
		const edgeOffsets = [
			-12, -8, -4, 0, 4, 8, 12, 8, 4, 0, -4, -8, -16, -24,
		];

		for (let run = 0; run < 20; run++) {
			for (const offset of edgeOffsets) {
				await page.mouse.move(center.x + offset, center.y + offset);
				await page.waitForTimeout(5);
			}

			await page.mouse.move(empty.x, empty.y);
			await page.waitForTimeout(25);
			expect(await getHighlightFeatures(page)).toEqual([]);
		}
	});
});
