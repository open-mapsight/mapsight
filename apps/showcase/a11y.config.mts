/**
 * Accessibility audit of the showcase demos, i.e. @mapsight/ui and
 * @mapsight/count-aggregator-ui, plus standalone scenario host pages.
 *
 *   pnpm --filter @mapsight/showcase build && pnpm --filter @mapsight/showcase start
 *   node packages/a11y-audit/src/cli.ts run --config apps/showcase/a11y.config.mts \
 *     --base-url http://localhost:4173 --out a11y-report/showcase
 */
import type {AuditConfig, ScenarioContext} from "@mapsight/a11y-audit";

const MAPSIGHT_ROOT = ".ms3-wrapper";

async function selectFirstListEntry(context: ScenarioContext) {
	const {root, page} = context;
	const entry = root.locator(".ms3-list__item button").first();
	await entry.waitFor({state: "visible", timeout: 20_000});
	context.step(
		`focus "${(await entry.innerText()).trim().slice(0, 60)}" and press Enter`,
	);
	await entry.focus();
	await entry.press("Enter");
	await page.waitForTimeout(1500);
}

const config: AuditConfig = {
	name: "Mapsight showcase",
	baseUrl: "http://localhost:4173",
	locale: "en-US",
	preset: "mapsight",
	hostOwner: "showcase page",
	owners: [
		{
			id: "@mapsight/count-aggregator-ui",
			selector: '[class^="msca"], [class*=" msca"]',
		},
	],
	targets: [
		{
			id: "scenarios",
			title: "Scenario overview",
			url: "/scenarios/index.html",
			root: "body",
			readySelector: "h1",
			features: [],
		},
		{
			id: "verwaltung",
			title: "Fictional citizen services",
			url: "/scenarios/verwaltung/index.html",
			root: "body",
			readySelector: ".ms3-list__item",
			features: ["map", "list", "details", "filters"],
		},
		{
			id: "ui-full",
			title: "Full UI (map, list, search, layers, details)",
			url: "/ui/full",
			root: MAPSIGHT_ROOT,
			readySelector: `${MAPSIGHT_ROOT} .ms3-list__item`,
			features: ["map", "list", "search", "details", "filters", "layers"],
			scenarios: [
				{
					id: "select-list-entry",
					title: "Select the first list entry with Enter",
					viewports: ["desktop", "mobile"],
					run: selectFirstListEntry,
					expectFocusWithin: ".ms3-feature-selection-info",
					checks: ["axe", "keyboard"],
				},
				{
					id: "select-and-close",
					title: "Close details and return to the list",
					viewports: ["desktop", "mobile"],
					run: async (context) => {
						await selectFirstListEntry(context);
						context.step("close details");
						await context.root
							.getByRole("button", {
								name: "Informationsdialog schließen",
							})
							.click();
					},
					expectFocusWithin: ".ms3-list",
					checks: ["axe", "keyboard"],
				},
			],
		},
		{
			id: "ui-combined-list",
			title: "Combined list from several sources",
			url: "/ui/combined-list",
			root: MAPSIGHT_ROOT,
			readySelector: `${MAPSIGHT_ROOT} .ms3-list__item`,
			features: ["map", "list", "details"],
		},
		{
			id: "count-aggregator",
			title: "Count aggregator dashboard",
			url: "/count-aggregator",
			root: "main",
			readySelector: '[class^="msca"], [class*=" msca"]',
			viewports: ["desktop", "reflow"],
			features: ["live-data"],
		},
	],
};

export default config;
