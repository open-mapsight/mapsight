import {type CheckContext, reportRule, settle} from "./context.ts";

const STYLE_ID = "mapsight-a11y-audit-text-spacing";

async function measureClipping(context: CheckContext) {
	return context.page.evaluate(() => {
		const api = window.__mapsightA11y!;
		const root = api.root();
		const result: Record<
			string,
			{
				clipped: boolean;
				info: {selector: string; html: string; owner: string};
			}
		> = {};
		if (!root) {
			return result;
		}
		const clips = (value: string) => value === "hidden" || value === "clip";
		for (const element of [root, ...root.querySelectorAll("*")]) {
			const hasText = [...element.childNodes].some(
				(node) => node.nodeType === 3 && node.textContent?.trim(),
			);
			if (!hasText || !api.isVisible(element)) {
				continue;
			}
			const style = getComputedStyle(element);
			let clipped =
				(clips(style.overflowX) &&
					element.scrollWidth > element.clientWidth + 1) ||
				(clips(style.overflowY) &&
					element.scrollHeight > element.clientHeight + 1);
			const rect = element.getBoundingClientRect();
			let ancestor = element.parentElement;
			for (let depth = 0; !clipped && ancestor && depth < 3; depth++) {
				const ancestorStyle = getComputedStyle(ancestor);
				const box = ancestor.getBoundingClientRect();
				if (
					(clips(ancestorStyle.overflowY) &&
						rect.bottom > box.bottom + 1) ||
					(clips(ancestorStyle.overflowX) &&
						rect.right > box.right + 1)
				) {
					clipped = true;
				}
				ancestor = ancestor.parentElement;
			}
			result[api.mark(element)] = {clipped, info: api.describe(element)};
		}
		return result;
	});
}

/**
 * 1.4.12: applies the WCAG text-spacing values to the integration and reports
 * text that is clipped afterwards but was not before.
 */
export async function textSpacingCheck(context: CheckContext): Promise<void> {
	const before = await measureClipping(context);
	const root = context.target.root ?? "body";
	await context.page.evaluate(
		({id, css}) => {
			const style = document.createElement("style");
			style.id = id;
			style.textContent = css;
			document.head.append(style);
		},
		{
			id: STYLE_ID,
			css: `${root}, ${root} *, ${root} *::before, ${root} *::after { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } ${root} p { margin-bottom: 2em !important; }`,
		},
	);
	await settle(context.page, 500);
	const after = await measureClipping(context);
	await context.page.evaluate(
		(id) => document.getElementById(id)?.remove(),
		STYLE_ID,
	);
	for (const [mark, state] of Object.entries(after)) {
		if (state.clipped && before[mark] && !before[mark].clipped) {
			reportRule(
				context,
				"text-spacing/clipped",
				state.info,
				"Text fits normally but is cut off with WCAG text spacing (line-height 1.5, letter 0.12em, word 0.16em, paragraph 2em).",
			);
		}
	}
}

/**
 * 1.4.10 at the current (narrow) viewport: horizontal page scrolling and the
 * elements that cause it; controls that are rendered but clipped away.
 */
export async function reflowCheck(context: CheckContext): Promise<void> {
	const result = await context.page.evaluate(() => {
		const api = window.__mapsightA11y!;
		const root = api.root();
		const width = document.documentElement.clientWidth;
		const pageScrolls = document.documentElement.scrollWidth > width + 1;
		const culprits: Array<{selector: string; html: string; owner: string}> =
			[];
		const clipped: Array<{selector: string; html: string; owner: string}> =
			[];
		if (!root) {
			return {pageScrolls, scrollWidth: 0, width, culprits, clipped};
		}
		const contained = (element: Element) => {
			let ancestor = element.parentElement;
			while (ancestor && ancestor !== document.documentElement) {
				const style = getComputedStyle(ancestor);
				if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) {
					const box = ancestor.getBoundingClientRect();
					if (box.right <= width + 1 && box.left >= -1) {
						return true;
					}
				}
				ancestor = ancestor.parentElement;
			}
			return false;
		};
		const map = api.config.mapViewport;
		if (pageScrolls) {
			const overflowing = new Set<Element>();
			for (const element of document.body.querySelectorAll("*")) {
				if (!api.isVisible(element)) {
					continue;
				}
				if (element.matches(`${map}, ${map} *, canvas`)) {
					continue;
				}
				const rect = element.getBoundingClientRect();
				if (
					(rect.right > width + 1 || rect.left < -1) &&
					!contained(element)
				) {
					overflowing.add(element);
				}
			}
			for (const element of overflowing) {
				if (
					element.parentElement &&
					overflowing.has(element.parentElement)
				) {
					continue;
				}
				culprits.push(api.describe(element));
			}
		}
		const controls =
			'a[href], button, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])';
		for (const element of root.querySelectorAll(controls)) {
			if (!api.isVisible(element) || element.closest(`${map} canvas`)) {
				continue;
			}
			const rect = element.getBoundingClientRect();
			if (rect.width <= 1 || rect.height <= 1) {
				continue; // visually hidden helpers
			}
			let left = Math.max(rect.left, 0);
			let right = Math.min(rect.right, width);
			let top = rect.top;
			let bottom = rect.bottom;
			let ancestor = element.parentElement;
			let scrollable = false;
			while (ancestor && ancestor !== document.body) {
				const style = getComputedStyle(ancestor);
				if (/(auto|scroll)/.test(style.overflowX + style.overflowY)) {
					scrollable = true;
					break;
				}
				const box = ancestor.getBoundingClientRect();
				if (/(hidden|clip)/.test(style.overflowX)) {
					left = Math.max(left, box.left);
					right = Math.min(right, box.right);
				}
				if (/(hidden|clip)/.test(style.overflowY)) {
					top = Math.max(top, box.top);
					bottom = Math.min(bottom, box.bottom);
				}
				ancestor = ancestor.parentElement;
			}
			if (!scrollable && (right - left < 1 || bottom - top < 1)) {
				clipped.push(api.describe(element));
			}
		}
		return {
			pageScrolls,
			scrollWidth: document.documentElement.scrollWidth,
			width,
			culprits,
			clipped,
		};
	});
	for (const culprit of result.culprits) {
		reportRule(
			context,
			"reflow/horizontal-scroll",
			culprit,
			`Page is ${result.scrollWidth}px wide at a ${result.width}px viewport; this element sticks out.`,
		);
	}
	for (const control of result.clipped) {
		reportRule(
			context,
			"reflow/clipped-control",
			control,
			"Control is rendered but entirely clipped by an overflow:hidden ancestor.",
			{status: "needs-review"},
		);
	}
}
