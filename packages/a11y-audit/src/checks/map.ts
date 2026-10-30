import {
	type CheckContext,
	axOfMark,
	clipShot,
	reportRule,
	settle,
} from "./context.ts";

const NAMED_MAP_ROLES = new Set([
	"region",
	"application",
	"img",
	"image",
	"figure",
	"group",
	"document",
	"Canvas",
	"main",
	"complementary",
]);

/**
 * The map surface needs a role and name (1.1.1/4.1.2) and must be operable
 * with the keyboard (2.1.1): focusable, and panned by arrow keys.
 */
export async function mapChecks(context: CheckContext): Promise<void> {
	const {page} = context;
	const map = await page.evaluate(() => {
		const api = window.__mapsightA11y!;
		const root = api.root();
		const viewport = root?.matches(api.config.mapViewport)
			? root
			: root?.querySelector(api.config.mapViewport);
		if (!root || !viewport || !api.isVisible(viewport)) {
			return null;
		}
		const ancestors: string[] = [];
		let current: Element | null = viewport;
		while (current && ancestors.length < 8) {
			ancestors.push(api.mark(current));
			if (current === root) {
				break;
			}
			current = current.parentElement;
		}
		for (const canvas of viewport.querySelectorAll("canvas")) {
			ancestors.push(api.mark(canvas));
		}
		const candidates = [
			...ancestors.map((mark) => api.byMark(mark)!),
			...viewport.querySelectorAll("[tabindex]"),
		].filter(
			(element) =>
				element &&
				(element as HTMLElement).tabIndex >= 0 &&
				!element.matches(api.config.mapControls) &&
				!element.closest(".ol-control") &&
				api.isVisible(element),
		);
		return {
			info: api.describe(viewport),
			ancestors,
			focusMark: candidates[0] ? api.mark(candidates[0]) : null,
			viewportMark: api.mark(viewport),
		};
	});
	if (!map) {
		return;
	}

	let named = false;
	for (const mark of map.ancestors) {
		const ax = await axOfMark(context, mark);
		if (ax && !ax.ignored && ax.name && NAMED_MAP_ROLES.has(ax.role)) {
			named = true;
			break;
		}
	}
	if (!named) {
		reportRule(
			context,
			"map/name",
			map.info,
			"Neither the map viewport, its canvas nor a close ancestor has a role with an accessible name.",
		);
	}

	if (!map.focusMark) {
		reportRule(
			context,
			"map/keyboard-focus",
			map.info,
			"No element of the map surface is in the tab order, so OpenLayers keyboard interactions cannot be used.",
		);
		return;
	}

	// pan test: compare the map before and after arrow keys
	await page.evaluate((mark) => {
		const api = window.__mapsightA11y!;
		(api.byMark(mark) as HTMLElement | null)?.focus();
	}, map.focusMark);
	await settle(page, 1200);
	// Focusing can scroll the document (especially an editorial host page).
	// Measure the viewport now; the pre-focus rectangle can point at unrelated
	// static content, producing either a false failure or an unjudged check.
	const rect = await page.evaluate((mark) => {
		const viewport = window.__mapsightA11y!.byMark(mark);
		if (!viewport) return null;
		const box = viewport.getBoundingClientRect();
		return {x: box.x, y: box.y, width: box.width, height: box.height};
	}, map.viewportMark);
	if (!rect) return;
	const clip = {
		x: rect.x + rect.width / 4,
		y: rect.y + rect.height / 4,
		width: rect.width / 2,
		height: rect.height / 2,
	};
	const first = await clipShot(page, clip, 0);
	await settle(page, 600);
	const stable = await clipShot(page, clip, 0);
	if (!first || !stable || !first.equals(stable)) {
		context.note("map: map surface kept changing; keyboard pan not judged");
		return;
	}
	for (let index = 0; index < 3; index++) {
		await page.keyboard.press("ArrowRight");
		await settle(page, 120);
	}
	await settle(page, 900);
	const moved = await clipShot(page, clip, 0);
	if (moved && stable.equals(moved)) {
		reportRule(
			context,
			"map/keyboard-pan",
			map.info,
			"The focused map surface did not change after pressing ArrowRight three times.",
		);
	}
}
