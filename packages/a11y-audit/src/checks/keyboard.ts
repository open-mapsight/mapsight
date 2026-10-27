import type {TabStop} from "../types.ts";
import {
	type CheckContext,
	axOfMark,
	clipShot,
	reportRule,
	settle,
} from "./context.ts";

const NON_INTERACTIVE_ROLES = new Set([
	"",
	"generic",
	"none",
	"presentation",
	"StaticText",
	"paragraph",
	"Section",
	"LayoutTable",
]);

interface StopState {
	kind: "none" | "sentinel" | "root" | "outside";
	which?: string;
	mark?: string;
	info?: {selector: string; html: string; owner: string};
	visible?: boolean;
	rect?: {x: number; y: number; width: number; height: number} | null;
	obscuredBy?: {selector: string; html: string; owner: string} | null;
	signature?: string;
	hasTabindexAttribute?: boolean;
	scrollable?: boolean;
	isMapSurface?: boolean;
}

/** Waits (max ~1 s) until the focused element stops moving, e.g. after smooth scrolling into view. */
async function waitForStillFocus(context: CheckContext): Promise<void> {
	await context.page.evaluate(async () => {
		const api = window.__mapsightA11y!;
		const frame = () =>
			new Promise<void>((resolve) =>
				requestAnimationFrame(() => resolve()),
			);
		let last = "";
		for (let attempt = 0; attempt < 60; attempt++) {
			const rect = api.deepActiveElement()?.getBoundingClientRect();
			const current = rect
				? `${rect.x},${rect.y},${rect.width},${rect.height}`
				: "";
			if (current === last) {
				return;
			}
			last = current;
			await frame();
			await frame();
		}
	});
}

async function readStop(context: CheckContext): Promise<StopState> {
	return context.page.evaluate(() => {
		const api = window.__mapsightA11y!;
		const element = api.deepActiveElement();
		if (
			!element ||
			element === document.body ||
			element === document.documentElement
		) {
			return {kind: "none"} as const;
		}
		const sentinel = element.getAttribute("data-a11y-audit-sentinel");
		if (sentinel) {
			return {kind: "sentinel", which: sentinel} as const;
		}
		const box = element.getBoundingClientRect();
		// sr-only patterns (1px, clipped) count as invisible while focused
		const visible =
			api.isVisible(element) && box.width > 2 && box.height > 2;
		const rect = api.visibleRect(element);
		const style = getComputedStyle(element);
		return {
			kind:
				api.inRoot(element) || element.closest(":modal")
					? "root"
					: "outside",
			mark: api.mark(element),
			info: api.describe(element),
			visible,
			rect,
			obscuredBy: visible && rect ? api.obscuredBy(element) : null,
			signature: api.focusSignature(element),
			hasTabindexAttribute: element.hasAttribute("tabindex"),
			scrollable:
				(/(auto|scroll)/.test(style.overflowY) &&
					element.scrollHeight > element.clientHeight) ||
				(/(auto|scroll)/.test(style.overflowX) &&
					element.scrollWidth > element.clientWidth),
			// the map's own focus target (viewport, canvas or a wrapper around
			// them) is judged by the map checks
			isMapSurface: Boolean(
				element.matches(api.config.mapViewport) ||
				(element.tagName === "CANVAS" &&
					element.closest(api.config.mapViewport)) ||
				(element.querySelector(api.config.mapViewport) &&
					!element.contains(api.root())),
			),
		} as const;
	});
}

/**
 * Compares the element's look while focused with its look after blur. Returns
 * true when a style property or the pixels around the element change.
 */
async function hasFocusIndicator(
	context: CheckContext,
	stop: StopState,
): Promise<boolean | null> {
	if (!stop.rect || !stop.mark) {
		return null;
	}
	const focusedShot = await clipShot(context.page, stop.rect);
	const unfocused = await context.page.evaluate((mark) => {
		const api = window.__mapsightA11y!;
		const element = api.byMark(mark) as HTMLElement | null;
		if (!element) {
			return null;
		}
		element.blur();
		return api.focusSignature(element);
	}, stop.mark);
	await settle(context.page, 80);
	const unfocusedShot = await clipShot(context.page, stop.rect);
	const restored = await context.page.evaluate((mark) => {
		const api = window.__mapsightA11y!;
		const element = api.byMark(mark) as HTMLElement | null;
		element?.focus({preventScroll: true});
		return api.deepActiveElement() === element;
	}, stop.mark);
	if (!restored) {
		context.note(
			`keyboard: could not restore focus to ${stop.info?.selector}; walk continues from the document`,
		);
	}
	await settle(context.page, 80);
	if (unfocused === null) {
		return null;
	}
	if (unfocused !== stop.signature) {
		return true;
	}
	if (focusedShot && unfocusedShot) {
		return !focusedShot.equals(unfocusedShot);
	}
	return null;
}

/**
 * Puts focusable sentinels around the integration root, or inside an open
 * modal dialog (the rest of the page is inert then). Returns null when the
 * walk cannot start, else whether it runs inside a modal.
 */
async function insertSentinels(
	context: CheckContext,
): Promise<{modal: boolean} | null> {
	return context.page.evaluate(() => {
		const api = window.__mapsightA11y!;
		const visibleModal = (selector: string) =>
			[...document.querySelectorAll(selector)].find((element) =>
				api.isVisible(element),
			);
		// native modal, else a scripted one (role=dialog + aria-modal / focus trap)
		const modal =
			visibleModal(":modal") ??
			visibleModal('[aria-modal="true"]') ??
			api.deepActiveElement()?.closest('[role="dialog"]') ??
			undefined;
		const root = modal ?? api.root();
		if (!root) {
			return null;
		}
		for (const node of document.querySelectorAll(
			"[data-a11y-audit-sentinel]",
		)) {
			node.remove();
		}
		const make = (which: string) => {
			const button = document.createElement("button");
			button.type = "button";
			button.textContent = `a11y audit ${which}`;
			button.setAttribute("data-a11y-audit-sentinel", which);
			button.style.cssText =
				"position:fixed;left:0;top:0;width:1px;height:1px;overflow:hidden;opacity:0.01;margin:0;padding:0;border:0;";
			return button;
		};
		const start = make("start");
		const end = make("end");
		if (
			modal ||
			root === document.body ||
			root === document.documentElement
		) {
			root.prepend(start);
			root.append(end);
		} else {
			root.before(start);
			root.after(end);
		}
		start.focus();
		return document.activeElement === start
			? {modal: Boolean(modal)}
			: null;
	});
}

/**
 * Tabs from just before the integration root until focus leaves it again.
 * Checks every stop for a name, a role, visibility, obstruction and a visible
 * focus indicator; detects traps; then looks for clickable elements the walk
 * never reached.
 */
export async function keyboardWalk(context: CheckContext): Promise<TabStop[]> {
	const {page, config} = context;
	const walk = await insertSentinels(context);
	if (!walk) {
		context.note("keyboard: root not found or sentinel not focusable");
		return [];
	}
	if (walk.modal) {
		context.note("keyboard: a modal dialog is open; walked inside it");
	}
	const stops: TabStop[] = [];
	const visited = new Set<string>();
	let exited = false;
	let trappedAt: StopState | undefined;
	let outside = 0;

	for (let index = 0; index < config.maxTabStops; index++) {
		await page.keyboard.press("Tab");
		await settle(page, 40);
		await waitForStillFocus(context);
		const stop = await readStop(context);
		if (stop.kind === "sentinel" || stop.kind === "none") {
			exited = true;
			break;
		}
		if (visited.has(stop.mark!)) {
			// a modal is supposed to keep focus inside
			if (walk.modal) {
				exited = true;
			} else {
				trappedAt = stop;
			}
			break;
		}
		visited.add(stop.mark!);
		if (stop.kind === "outside") {
			// e.g. a portal at the end of <body>; leaving for good after a few
			if (++outside > 5) {
				exited = true;
				break;
			}
		}
		const info = stop.info!;
		const ax = await axOfMark(context, stop.mark!);
		const flags: string[] = [];
		const element = {...info, role: ax?.role, name: ax?.name};

		if (!stop.visible || !stop.rect) {
			flags.push("hidden");
			reportRule(
				context,
				"keyboard/focus-hidden-element",
				element,
				stop.visible
					? `Tab stop ${index + 1} (${ax?.role || "no role"} "${ax?.name ?? ""}") stays clipped by a scroll or overflow container while focused (not scrolled into view).`
					: `Tab stop ${index + 1} (${ax?.role || "no role"} "${ax?.name ?? ""}") is not visible while focused (hidden, transparent or 1–2 px).`,
			);
		} else {
			if (stop.obscuredBy) {
				flags.push("obscured");
				// routed to whoever owns the covering element
				reportRule(
					context,
					"keyboard/focus-obscured",
					{...stop.obscuredBy, name: ax?.name},
					`Tab stop ${index + 1} (${ax?.role || "no role"} "${ax?.name ?? ""}", ${info.selector}) is entirely covered by ${stop.obscuredBy.selector} while focused.`,
				);
			}
			const indicator = await hasFocusIndicator(context, stop);
			if (indicator === false) {
				flags.push("no-focus-indicator");
				reportRule(
					context,
					"keyboard/focus-visible",
					element,
					`Tab stop ${index + 1} (${ax?.role || "no role"} "${ax?.name ?? ""}") looks the same focused and unfocused.`,
				);
			}
		}

		if (ax && !ax.ignored) {
			const roleless = NON_INTERACTIVE_ROLES.has(ax.role);
			if (roleless && stop.scrollable && !stop.hasTabindexAttribute) {
				flags.push("scroller");
				reportRule(
					context,
					"keyboard/focus-no-role",
					element,
					`Scroll container focused by the browser (keyboard-focusable scroller) without role or name; screen readers announce nothing.`,
					{status: "needs-review", impact: "minor"},
				);
			} else if (roleless && !stop.isMapSurface) {
				flags.push("no-role");
				reportRule(
					context,
					"keyboard/focus-no-role",
					element,
					`Tab stop ${index + 1} has role "${ax.role || "none"}".`,
				);
			}
			if (!ax.name && !roleless) {
				flags.push("no-name");
				reportRule(
					context,
					"keyboard/focus-unnamed",
					element,
					`Tab stop ${index + 1} (${ax.role}) has no accessible name.`,
				);
			}
		} else if (ax?.ignored) {
			flags.push("ax-ignored");
			reportRule(
				context,
				"keyboard/focus-unnamed",
				element,
				`Tab stop ${index + 1} is focusable but hidden from assistive technology (aria-hidden or similar).`,
			);
		}

		stops.push({
			index: index + 1,
			selector: info.selector,
			owner: info.owner,
			role: ax?.role ?? "?",
			name: ax?.name ?? "",
			flags,
		});
	}

	const rootInfo = await page.evaluate(() => {
		const api = window.__mapsightA11y!;
		const root = api.root();
		return root ? api.describe(root) : null;
	});
	if (trappedAt && rootInfo) {
		reportRule(
			context,
			"keyboard/trap",
			{...trappedAt.info!},
			`Tab returned to ${trappedAt.info?.selector} after ${stops.length} stops without leaving the integration.`,
		);
	} else if (!exited && rootInfo) {
		reportRule(
			context,
			"keyboard/walk-incomplete",
			rootInfo,
			`Focus was still inside the integration after ${config.maxTabStops} Tab presses.`,
			{status: "needs-review"},
		);
	}

	const inRootStops = stops.filter((stop) => stop.owner !== config.hostOwner);
	if (inRootStops.length > 40 && rootInfo) {
		const hasSkip = stops
			.slice(0, 3)
			.some((stop) =>
				/(überspringen|skip|springen zu|jump to|zum ende)/i.test(
					stop.name,
				),
			);
		if (!hasSkip) {
			reportRule(
				context,
				"keyboard/bypass",
				rootInfo,
				`${inRootStops.length} tab stops inside the integration and no skip link among the first three.`,
				{status: "needs-review"},
			);
		}
	}

	await reportUnreachable(context, [...visited]);
	await page.evaluate(() => {
		for (const node of document.querySelectorAll(
			"[data-a11y-audit-sentinel]",
		)) {
			node.remove();
		}
	});
	return stops;
}

const INTERACTIVE =
	'a[href], button, input, select, textarea, summary, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [role="tab"], [role="menuitem"], [role="option"]';

/**
 * Pointer-clickable elements that Tab never reached. Items inside a focusable
 * container (tabindex=-1, roving pattern) pass if ArrowDown on the container
 * moves focus or aria-activedescendant to an item.
 */
async function reportUnreachable(
	context: CheckContext,
	visitedMarks: string[],
): Promise<void> {
	const {page} = context;
	const candidates = await page.evaluate(
		({marks, interactive}) => {
			const api = window.__mapsightA11y!;
			const root = api.root();
			if (!root) {
				return [];
			}
			const visited = marks
				.map((mark) => api.byMark(mark))
				.filter((element): element is Element => Boolean(element));
			const out: Array<{
				mark: string;
				info: {selector: string; html: string; owner: string};
				tabindex: string | null;
				text: string;
				container: string | null;
				group: string | null;
			}> = [];
			for (const element of root.querySelectorAll("*")) {
				if (!api.isVisible(element)) {
					continue;
				}
				if (getComputedStyle(element).cursor !== "pointer") {
					continue;
				}
				const parent = element.parentElement;
				if (parent && getComputedStyle(parent).cursor === "pointer") {
					continue;
				}
				if (
					element.matches(
						`canvas, label, option, ${api.config.mapViewport}, ${api.config.mapViewport} *`,
					)
				) {
					continue;
				}
				if (api.isFocusable(element)) {
					continue;
				}
				if (
					element.closest(
						"[inert], [disabled], [aria-disabled='true']",
					)
				) {
					continue;
				}
				// part of a control Tab reached (icon in a button, li around a button)
				if (
					visited.some(
						(focused) =>
							element.contains(focused) ||
							(focused.contains(element) &&
								focused.matches(interactive)),
					)
				) {
					continue;
				}
				let container =
					visited.find((focused) => focused.contains(element)) ??
					null;
				// Roving tabindex: the tab stop is a sibling item of the same
				// composite widget, not a container around it.
				const group =
					container || element.getAttribute("tabindex") !== "-1"
						? null
						: element.closest(
								'ul, ol, [role="list"], [role="listbox"], [role="grid"], [role="tablist"], [role="toolbar"], [role="menu"], [role="menubar"], [role="radiogroup"], [role="tree"]',
							);
				if (group && root.contains(group)) {
					container =
						visited.find(
							(focused) =>
								group.contains(focused) &&
								!focused.contains(element),
						) ?? null;
				}
				out.push({
					mark: api.mark(element),
					info: api.describe(element),
					tabindex: element.getAttribute("tabindex"),
					text: ((element as HTMLElement).innerText ?? "")
						.trim()
						.slice(0, 60),
					container: container ? api.mark(container) : null,
					group: group && container ? api.mark(group) : null,
				});
			}
			return out;
		},
		{marks: visitedMarks, interactive: INTERACTIVE},
	);

	const rovingWorks = new Map<string, boolean>();
	for (const container of new Set(
		candidates.flatMap((candidate) =>
			candidate.tabindex === "-1" && candidate.container
				? [candidate.container]
				: [],
		),
	)) {
		const members = candidates.filter(
			(candidate) => candidate.container === container,
		);
		const items = members.map((candidate) => candidate.mark);
		const group =
			members.find((candidate) => candidate.group)?.group ?? null;
		await page.evaluate((mark) => {
			(
				window.__mapsightA11y!.byMark(mark) as HTMLElement | null
			)?.focus();
		}, container);
		await page.keyboard.press("ArrowDown");
		await settle(page, 150);
		const reached = await page.evaluate(
			({containerMark, itemMarks, groupMark}) => {
				const api = window.__mapsightA11y!;
				const box = api.byMark(containerMark);
				const active = api.deepActiveElement();
				if (groupMark) {
					// sibling tab stop: ArrowDown must move focus to another item
					const groupElement = api.byMark(groupMark);
					return Boolean(
						active &&
						active !== box &&
						groupElement?.contains(active),
					);
				}
				const descendantId = (active ?? box)?.getAttribute(
					"aria-activedescendant",
				);
				const target =
					(descendantId && document.getElementById(descendantId)) ||
					(active !== box ? active : null);
				return Boolean(
					target &&
					itemMarks.some((mark) => {
						const item = api.byMark(mark);
						return (
							item &&
							(item === target ||
								item.contains(target) ||
								target.contains(item))
						);
					}),
				);
			},
			{containerMark: container, itemMarks: items, groupMark: group},
		);
		rovingWorks.set(container, reached);
	}

	for (const candidate of candidates) {
		const element = {...candidate.info, name: candidate.text};
		if (candidate.tabindex === "-1" && candidate.container) {
			if (!rovingWorks.get(candidate.container)) {
				reportRule(
					context,
					"keyboard/not-focusable-clickable",
					element,
					candidate.group
						? `Item ("${candidate.text}") has tabindex=-1; Tab reaches another item of its group, but ArrowDown there does not move focus.`
						: `Item ("${candidate.text}") has tabindex=-1; Tab reaches its container, but ArrowDown there moves neither focus nor aria-activedescendant to the items.`,
				);
			}
			continue;
		}
		const roving = candidate.tabindex === "-1";
		reportRule(
			context,
			"keyboard/not-focusable-clickable",
			element,
			roving
				? `Pointer-clickable element ("${candidate.text}") has tabindex=-1 and no focusable container; verify another keyboard path reaches it.`
				: `Pointer-clickable element ("${candidate.text}") is not focusable.`,
			roving ? {status: "needs-review", impact: "moderate"} : {},
		);
	}
}
