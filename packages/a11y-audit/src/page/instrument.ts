/**
 * In-page helpers, installed with `page.addInitScript(installInPage, config)`.
 *
 * Playwright serialises this function with `toString()`, so it must stay
 * self-contained: no imports, no references to module scope.
 */
export interface InPageConfig {
	root: string;
	owners: Array<{id: string; selector: string}>;
	hostOwner: string;
	mapViewport: string;
	mapControls: string;
}

export interface InPageElementInfo {
	selector: string;
	html: string;
	owner: string;
}

export interface InPageApi {
	config: InPageConfig;
	announcements: string[];
	probe: Element | null;
	root(): Element | null;
	stableSelector(element: Element): string;
	ownerOf(element: Element): string;
	describe(element: Element): InPageElementInfo;
	deepActiveElement(): Element | null;
	isVisible(element: Element): boolean;
	isFocusable(element: Element): boolean;
	inRoot(element: Element | null): boolean;
	mark(element: Element): string;
	byMark(id: string): Element | null;
	focusSignature(element: Element): string;
	visibleRect(
		element: Element,
	): {x: number; y: number; width: number; height: number} | null;
	isObscured(element: Element): boolean;
	/** The element covering the focused one's centre, if it is fully covered. */
	obscuredBy(element: Element): InPageElementInfo | null;
}

declare global {
	interface Window {
		__mapsightA11y?: InPageApi;
	}
}

export function installInPage(config: InPageConfig): void {
	if (window.__mapsightA11y) {
		window.__mapsightA11y.config = config;
		return;
	}

	const LIVE_SELECTOR =
		'[aria-live]:not([aria-live="off"]),[role="status"],[role="alert"],[role="log"],[role="timer"],output';
	const announcements: string[] = [];
	const lastText = new WeakMap<Element, string>();

	function textOf(element: Element): string {
		const html = element as HTMLElement;
		return (html.innerText ?? element.textContent ?? "")
			.replace(/\s+/g, " ")
			.trim();
	}

	function recordRegion(region: Element, inserted: boolean) {
		const text = textOf(region);
		if (!text || lastText.get(region) === text) {
			return;
		}
		lastText.set(region, text);
		const politeness =
			region.getAttribute("aria-live") ??
			(region.getAttribute("role") === "alert" ? "assertive" : "polite");
		announcements.push(
			`${inserted ? "(inserted) " : ""}[${politeness}] ${text.slice(0, 200)}`,
		);
	}

	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			const target =
				mutation.target.nodeType === 1
					? (mutation.target as Element)
					: mutation.target.parentElement;
			const region = target?.closest(LIVE_SELECTOR);
			if (region) {
				recordRegion(region, false);
			}
			if (region) {
				continue;
			}
			for (const node of mutation.addedNodes) {
				if (node.nodeType !== 1) {
					continue;
				}
				const element = node as Element;
				const inserted = element.matches(LIVE_SELECTOR)
					? [element]
					: [...element.querySelectorAll(LIVE_SELECTOR)];
				for (const live of inserted) {
					recordRegion(live, true);
				}
			}
		}
	});

	function startObserving() {
		observer.observe(document.documentElement, {
			subtree: true,
			childList: true,
			characterData: true,
		});
		// Regions present at load are a baseline, not announcements.
		for (const region of document.querySelectorAll(LIVE_SELECTOR)) {
			lastText.set(region, textOf(region));
		}
	}

	if (document.documentElement) {
		startObserving();
	} else {
		document.addEventListener("DOMContentLoaded", startObserving, {
			once: true,
		});
	}

	let markCounter = 0;

	const api: InPageApi = {
		config,
		announcements,
		probe: null,

		root() {
			return document.querySelector(api.config.root);
		},

		stableSelector(element) {
			const root = api.root();
			const segments: string[] = [];
			let current: Element | null = element;
			while (current && current !== root && segments.length < 4) {
				const tag = current.tagName.toLowerCase();
				if (tag === "body" || tag === "html") {
					break;
				}
				const id = current.id;
				if (id && !/\d/.test(id) && !/[:«»]/.test(id)) {
					segments.unshift(`${tag}#${id}`);
					break;
				}
				const classes = [...current.classList]
					.filter(
						(name) =>
							/^[a-zA-Z_][\w-]*$/.test(name) &&
							!/\d{3,}|--|^is-|^has-|^_|^css-|^sc-|^hint--/.test(
								name,
							) &&
							!/^(js-)?focus-visible$|^(active|selected|open|hidden|visible|disabled|current|expanded|collapsed)$/.test(
								name,
							),
					)
					.slice(0, 2);
				const role = current.getAttribute("role");
				segments.unshift(
					tag +
						(role ? `[role="${role}"]` : "") +
						classes.map((name) => `.${name}`).join(""),
				);
				current = current.parentElement;
			}
			return segments.join(" > ") || element.tagName.toLowerCase();
		},

		ownerOf(element) {
			const root = api.root();
			let current: Element | null = element;
			while (current) {
				for (const owner of api.config.owners) {
					try {
						if (current.matches(owner.selector)) {
							return owner.id;
						}
					} catch {
						// invalid selector in config; ignore
					}
				}
				if (current === root) {
					return "unattributed";
				}
				current = current.parentElement;
			}
			return api.config.hostOwner;
		},

		describe(element) {
			const outer = (element.outerHTML ?? "").replace(
				/ data-a11y-audit-id="\d+"/g,
				"",
			);
			const openTag = outer.slice(0, outer.indexOf(">") + 1) || outer;
			return {
				selector: api.stableSelector(element),
				html:
					openTag.length > 240
						? `${openTag.slice(0, 237)}...`
						: openTag,
				owner: api.ownerOf(element),
			};
		},

		deepActiveElement() {
			let active: Element | null = document.activeElement;
			while (active?.shadowRoot?.activeElement) {
				active = active.shadowRoot.activeElement;
			}
			return active;
		},

		isVisible(element) {
			if (
				!element.checkVisibility({
					opacityProperty: true,
					visibilityProperty: true,
				})
			) {
				return false;
			}
			const rect = element.getBoundingClientRect();
			return rect.width > 0 && rect.height > 0;
		},

		isFocusable(element) {
			const html = element as HTMLElement;
			if (html.tabIndex >= 0) {
				return !(html as HTMLButtonElement).disabled;
			}
			return false;
		},

		inRoot(element) {
			const root = api.root();
			return Boolean(element && root && root.contains(element));
		},

		mark(element) {
			let id = element.getAttribute("data-a11y-audit-id");
			if (!id) {
				id = String(++markCounter);
				element.setAttribute("data-a11y-audit-id", id);
			}
			return id;
		},

		byMark(id) {
			return document.querySelector(`[data-a11y-audit-id="${id}"]`);
		},

		focusSignature(element) {
			const properties = [
				"outline-style",
				"outline-width",
				"outline-color",
				"outline-offset",
				"box-shadow",
				"border-top-color",
				"border-bottom-color",
				"border-top-width",
				"border-bottom-width",
				"background-color",
				"background-image",
				"color",
				"text-decoration-line",
				"text-decoration-thickness",
				"opacity",
				"transform",
				"filter",
			];
			const parts: string[] = [];
			const snapshot = (target: Element, pseudo: string | null) => {
				const style = getComputedStyle(target, pseudo);
				parts.push(
					properties
						.map((name) => style.getPropertyValue(name))
						.join("|"),
				);
			};
			snapshot(element, null);
			snapshot(element, "::before");
			snapshot(element, "::after");
			for (const child of [...element.children].slice(0, 3)) {
				snapshot(child, null);
			}
			let ancestor = element.parentElement;
			for (let depth = 0; ancestor && depth < 3; depth++) {
				snapshot(ancestor, null);
				ancestor = ancestor.parentElement;
			}
			return parts.join("\n");
		},

		visibleRect(element) {
			const rect = element.getBoundingClientRect();
			let left = Math.max(rect.left, 0);
			let top = Math.max(rect.top, 0);
			let right = Math.min(rect.right, window.innerWidth);
			let bottom = Math.min(rect.bottom, window.innerHeight);
			let ancestor = element.parentElement;
			while (ancestor && ancestor !== document.body) {
				const style = getComputedStyle(ancestor);
				const clipsX = /hidden|clip|auto|scroll/.test(style.overflowX);
				const clipsY = /hidden|clip|auto|scroll/.test(style.overflowY);
				if (clipsX || clipsY) {
					const box = ancestor.getBoundingClientRect();
					if (clipsX) {
						left = Math.max(left, box.left);
						right = Math.min(right, box.right);
					}
					if (clipsY) {
						top = Math.max(top, box.top);
						bottom = Math.min(bottom, box.bottom);
					}
				}
				ancestor = ancestor.parentElement;
			}
			if (right - left < 1 || bottom - top < 1) {
				return null;
			}
			return {x: left, y: top, width: right - left, height: bottom - top};
		},

		isObscured(element) {
			const rect = api.visibleRect(element);
			if (!rect) {
				return false;
			}
			const inset = Math.min(3, rect.width / 4, rect.height / 4);
			const points = [
				[rect.x + rect.width / 2, rect.y + rect.height / 2],
				[rect.x + inset, rect.y + inset],
				[rect.x + rect.width - inset, rect.y + inset],
				[rect.x + inset, rect.y + rect.height - inset],
				[rect.x + rect.width - inset, rect.y + rect.height - inset],
			] as const;
			return points.every(([x, y]) => {
				const hit = document.elementFromPoint(x, y);
				return Boolean(
					hit && !element.contains(hit) && !hit.contains(element),
				);
			});
		},

		obscuredBy(element) {
			if (!api.isObscured(element)) {
				return null;
			}
			const rect = api.visibleRect(element)!;
			const hit = document.elementFromPoint(
				rect.x + rect.width / 2,
				rect.y + rect.height / 2,
			);
			return hit ? api.describe(hit) : null;
		},
	};

	window.__mapsightA11y = api;
}
