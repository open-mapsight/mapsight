import {chromium} from "playwright";
import {expect, it} from "vitest";

import {mapChecks} from "./checks/map.ts";
import {resolveConfig} from "./config.ts";
import {installInPage} from "./page/instrument.ts";
import type {RawFinding} from "./types.ts";

for (const pans of [true, false]) {
	it(`judges a ${pans ? "working" : "broken"} map after focus scrolls it into view`, async () => {
		const browser = await chromium.launch({
			executablePath: process.env.MAPSIGHT_A11Y_BROWSER,
		});
		try {
			const page = await browser.newPage({
				viewport: {width: 800, height: 600},
			});
			await page.setContent(
				`<style>body{margin:0}.ol-viewport{width:420px;height:240px;background:#ddd;position:relative}.marker{position:absolute;top:100px;left:180px;width:24px;height:24px;background:#006699}</style><div style="height:1200px"></div><main id="app"><div class="ol-viewport" tabindex="0" role="region" aria-label="Test map"><span class="marker"></span></div></main><div style="height:1200px"></div>`,
			);
			await page.evaluate(installInPage, {
				root: "#app",
				owners: [],
				hostOwner: "fixture",
				mapViewport: ".ol-viewport",
				mapControls: "button",
			});
			await page.locator(".ol-viewport").evaluate((element, moves) => {
				let offset = 0;
				element.addEventListener("keydown", (event) => {
					if ((event as KeyboardEvent).key !== "ArrowRight") return;
					event.preventDefault();
					if (moves) {
						offset += 30;
						(
							element.querySelector(".marker") as HTMLElement
						).style.transform = `translateX(${offset}px)`;
					}
				});
			}, pans);
			const target = {
				id: "map",
				title: "Map",
				url: "about:blank",
				root: "#app",
			};
			const viewport = {id: "desktop", width: 800, height: 600};
			const findings: RawFinding[] = [];
			const notes: string[] = [];
			await mapChecks({
				page,
				cdp: await page.context().newCDPSession(page),
				target,
				viewport,
				config: resolveConfig({
					name: "focus scroll",
					targets: [target],
				}),
				reload: async () => {},
				report: (finding) => findings.push(finding),
				note: (message) => notes.push(message),
			});
			expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(
				0,
			);
			expect(notes).toEqual([]);
			expect(
				findings.filter(
					(finding) => finding.rule === "map/keyboard-pan",
				),
			).toHaveLength(pans ? 0 : 1);
		} finally {
			await browser.close();
		}
	});
}
