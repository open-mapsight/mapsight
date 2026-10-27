import {type CheckContext, axOfMark, reportRule, settle} from "./context.ts";

interface Trigger {
	key: string;
	mark: string;
	info: {selector: string; html: string; owner: string};
	expanded: string | null;
	haspopup: string | null;
	label: string;
}

interface Observation {
	url: string;
	expanded: string | null;
	popups: string[];
	controlsVisible: boolean | null;
	activeMark: string | null;
	activeKey: string | null;
	activeIsBody: boolean;
}

const POPUP_SELECTOR =
	'dialog[open], [role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [aria-modal="true"]';

async function collectTriggers(context: CheckContext): Promise<Trigger[]> {
	return context.page.evaluate(() => {
		const api = window.__mapsightA11y!;
		const root = api.root();
		if (!root) {
			return [];
		}
		return [
			...root.querySelectorAll(
				'[aria-expanded], [aria-haspopup]:not([aria-haspopup="false"])',
			),
		]
			.filter(
				(element) =>
					element.matches(
						'button, a[href], [role="button"], summary',
					) &&
					api.isVisible(element) &&
					!(element as HTMLButtonElement).disabled &&
					element.getAttribute("aria-disabled") !== "true",
			)
			.map((element) => {
				const info = api.describe(element);
				const label = (
					element.getAttribute("aria-label") ??
					(element as HTMLElement).innerText ??
					""
				)
					.replace(/\s+/g, " ")
					.trim()
					.slice(0, 50);
				return {
					key: `${info.selector}|${label}`,
					mark: api.mark(element),
					info,
					expanded: element.getAttribute("aria-expanded"),
					haspopup: element.getAttribute("aria-haspopup"),
					label,
				};
			});
	});
}

async function observe(
	context: CheckContext,
	trigger: Trigger,
): Promise<Observation> {
	const state = await context.page.evaluate(
		({mark, popupSelector, key}) => {
			const api = window.__mapsightA11y!;
			let element = api.byMark(mark);
			if (!element) {
				// re-rendered trigger: find it again by selector and label
				const [selector] = key.split("|");
				element =
					[...document.querySelectorAll("*")].find(
						(candidate) =>
							api.stableSelector(candidate) === selector &&
							candidate.hasAttribute("aria-expanded"),
					) ?? null;
			}
			const popups = [...document.querySelectorAll(popupSelector)]
				.filter((popup) => api.isVisible(popup))
				.map((popup) => api.mark(popup));
			const controls = element?.getAttribute("aria-controls");
			const controlled = controls
				? document.getElementById(controls)
				: null;
			const active = api.deepActiveElement();
			const activeElement =
				!active ||
				active === document.body ||
				active === document.documentElement
					? null
					: active;
			const activeIsBody = activeElement === null;
			return {
				url: location.href,
				expanded: element?.getAttribute("aria-expanded") ?? null,
				popups,
				controlsVisible: controls
					? Boolean(controlled && api.isVisible(controlled))
					: null,
				activeMark: activeElement ? api.mark(activeElement) : null,
				activeKey: !activeElement
					? null
					: `${api.stableSelector(activeElement)}|${(
							activeElement.getAttribute("aria-label") ??
							(activeElement as HTMLElement).innerText ??
							""
						)
							.replace(/\s+/g, " ")
							.trim()
							.slice(0, 50)}`,
				activeIsBody,
			};
		},
		{mark: trigger.mark, popupSelector: POPUP_SELECTOR, key: trigger.key},
	);
	return state;
}

function opened(before: Observation, after: Observation): string[] {
	return after.popups.filter((mark) => !before.popups.includes(mark));
}

function changed(before: Observation, after: Observation): boolean {
	return (
		before.url !== after.url ||
		before.expanded !== after.expanded ||
		before.controlsVisible !== after.controlsVisible ||
		opened(before, after).length > 0
	);
}

async function focusTrigger(
	context: CheckContext,
	mark: string,
): Promise<boolean> {
	return context.page.evaluate((id) => {
		const api = window.__mapsightA11y!;
		const element = api.byMark(id) as HTMLElement | null;
		element?.focus();
		return Boolean(element) && api.deepActiveElement() === element;
	}, mark);
}

async function popupInfo(context: CheckContext, mark: string) {
	return context.page.evaluate((id) => {
		const api = window.__mapsightA11y!;
		const popup = api.byMark(id);
		if (!popup) {
			return null;
		}
		const active = api.deepActiveElement();
		return {
			info: api.describe(popup),
			dialogLike: popup.matches(
				'dialog, [role="dialog"], [role="alertdialog"]',
			),
			modal:
				popup.matches(":modal") ||
				popup.getAttribute("aria-modal") === "true",
			focusInside: Boolean(active && popup.contains(active)),
		};
	}, mark);
}

/**
 * For every aria-expanded / aria-haspopup trigger in the integration: opens it
 * with the keyboard, checks state, name, focus placement and containment,
 * runs `onOpen` (axe) on the open state, closes it with Escape and checks
 * that focus returns.
 */
export async function dialogContract(
	context: CheckContext,
	onOpen: (label: string) => Promise<void>,
): Promise<void> {
	const tested = new Set<string>();
	for (let round = 0; round < context.config.maxDialogTriggers; round++) {
		const triggers = await collectTriggers(context);
		const trigger = triggers.find(
			(candidate) => !tested.has(candidate.key),
		);
		if (!trigger) {
			return;
		}
		tested.add(trigger.key);
		let restored = false;
		try {
			restored = await testTrigger(context, trigger, onOpen);
		} catch (error) {
			context.note(
				`dialogs: ${trigger.label || trigger.info.selector}: ${(error as Error).message.split("\n")[0]}`,
			);
		}
		if (!restored) {
			await context.reload();
		}
	}
}

async function testTrigger(
	context: CheckContext,
	trigger: Trigger,
	onOpen: (label: string) => Promise<void>,
): Promise<boolean> {
	const {page} = context;
	const element = {...trigger.info, name: trigger.label};
	const before = await observe(context, trigger);

	let after = before;
	for (const key of ["Enter", " "]) {
		if (!(await focusTrigger(context, trigger.mark))) {
			return false;
		}
		await page.keyboard.press(key);
		await settle(page, 450);
		after = await observe(context, trigger);
		if (changed(before, after)) {
			break;
		}
	}
	if (!changed(before, after)) {
		const locator = page.locator(`[data-a11y-audit-id="${trigger.mark}"]`);
		await locator.click({timeout: 3000}).catch(() => undefined);
		await settle(page, 450);
		after = await observe(context, trigger);
		if (changed(before, after)) {
			reportRule(
				context,
				"dialog/activation-key",
				element,
				`"${trigger.label}" opens on click, but neither Enter nor Space does anything.`,
			);
		} else {
			return true; // no observable effect at all; nothing to judge
		}
	}
	if (after.url !== before.url) {
		return false;
	}

	const newPopups = opened(before, after);
	let popup: Awaited<ReturnType<typeof popupInfo>> = null;
	let popupMark: string | undefined;
	for (const mark of newPopups) {
		const info = await popupInfo(context, mark);
		if (info && (!popup || (info.dialogLike && !popup.dialogLike))) {
			popup = info;
			popupMark = mark;
		}
	}
	const isPopup = Boolean(trigger.haspopup) || Boolean(popup);

	if (trigger.expanded !== null && after.expanded !== "true") {
		reportRule(
			context,
			"dialog/expanded-state",
			element,
			`After opening, aria-expanded is "${after.expanded}".`,
		);
	}

	if (popup && popupMark) {
		if (popup.dialogLike) {
			const ax = await axOfMark(context, popupMark);
			if (ax && !ax.name) {
				reportRule(
					context,
					"dialog/name",
					popup.info,
					`Dialog opened by "${trigger.label}" has no accessible name.`,
				);
			}
		}
		if (
			!popup.focusInside &&
			(popup.modal || trigger.haspopup === "dialog")
		) {
			reportRule(
				context,
				"dialog/initial-focus",
				element,
				`After opening "${trigger.label}", focus stays outside the ${popup.modal ? "modal " : ""}dialog.`,
				popup.modal ? {} : {status: "needs-review", impact: "moderate"},
			);
		}
	}

	await onOpen(trigger.label || trigger.info.selector);

	if (popup?.modal && popupMark) {
		for (let index = 0; index < 25; index++) {
			await page.keyboard.press("Tab");
			await settle(page, 30);
			const inside = await page.evaluate((id) => {
				const api = window.__mapsightA11y!;
				const container = api.byMark(id);
				const active = api.deepActiveElement();
				// body = focus went to the browser UI, which a modal allows
				if (!active || active === document.body) {
					return true;
				}
				return Boolean(container?.contains(active));
			}, popupMark);
			if (!inside) {
				reportRule(
					context,
					"dialog/focus-containment",
					popup.info,
					`Tab ${index + 1} moved focus out of the open modal dialog ("${trigger.label}").`,
				);
				break;
			}
		}
	}

	// press Escape where the user would be: on the element focused at opening
	if (after.activeMark) {
		await page.evaluate((mark) => {
			const api = window.__mapsightA11y!;
			const element = api.byMark(mark) as HTMLElement | null;
			if (element && api.deepActiveElement() !== element) {
				element.focus();
			}
		}, after.activeMark);
	}
	await page.keyboard.press("Escape");
	await settle(page, 400);
	let closed = await observe(context, trigger);
	const stillOpen =
		(popupMark !== undefined && closed.popups.includes(popupMark)) ||
		closed.expanded === "true" ||
		closed.controlsVisible === true;

	if (stillOpen) {
		if (isPopup) {
			reportRule(
				context,
				"dialog/escape",
				element,
				`Escape left the popup of "${trigger.label}" open.`,
			);
		}
		// close it the way it was opened
		if (await focusTrigger(context, trigger.mark)) {
			await page.keyboard.press("Enter");
			await settle(page, 400);
		}
		closed = await observe(context, trigger);
		return !changed(before, closed);
	}

	if (isPopup) {
		const returned =
			closed.activeMark === trigger.mark ||
			closed.activeKey === trigger.key;
		if (!returned) {
			reportRule(
				context,
				"dialog/focus-return",
				element,
				closed.activeIsBody
					? `After closing "${trigger.label}" with Escape, focus is lost (document body).`
					: `After closing "${trigger.label}" with Escape, focus moved to ${closed.activeKey?.split("|")[0]} instead of the trigger.`,
				closed.activeIsBody ? {} : {impact: "moderate"},
			);
		}
	}
	return !changed(before, closed);
}
