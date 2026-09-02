/**
 * Mark the rest of the document inert while a full-viewport overlay is open.
 *
 * Walks from `container` to `document.body` and sets `inert` on siblings so
 * keyboard and AT cannot reach host-page chrome behind the overlay
 * (WCAG 2.4.3 / EN 301 549 / BITV 2.0). Native `<dialog showModal>` and
 * react-modal portals stay interactive.
 */

const LIVE_ROLES = new Set(["alert", "log", "status", "timer"]);
const INERT_SKIP_TAGS = new Set([
	"LINK",
	"META",
	"NOSCRIPT",
	"SCRIPT",
	"STYLE",
	"TEMPLATE",
]);

export function isExemptFromInert(element: Element): boolean {
	if (!(element instanceof HTMLElement)) {
		return true;
	}

	if (INERT_SKIP_TAGS.has(element.tagName)) {
		return true;
	}

	if (element.tagName === "DIALOG") {
		return true;
	}

	if (element.classList.contains("ReactModalPortal")) {
		return true;
	}

	if (element.hasAttribute("data-ms3-portal")) {
		return true;
	}

	if (element.hasAttribute("aria-live")) {
		return true;
	}

	const role = element.getAttribute("role");
	return role != null && LIVE_ROLES.has(role);
}

/**
 * Siblings of `container` and each ancestor up to (but not including) `body`.
 * Skips nodes that are already inert or must stay reachable (portals, live regions).
 */
export function collectInertTargets(container: HTMLElement): HTMLElement[] {
	const targets: HTMLElement[] = [];
	let current: HTMLElement | null = container;

	while (current && current !== document.body) {
		const parent = current.parentElement;
		if (!parent) {
			break;
		}

		for (const sibling of Array.from(parent.children)) {
			if (sibling === current || !(sibling instanceof HTMLElement)) {
				continue;
			}
			if (sibling.hasAttribute("inert") || isExemptFromInert(sibling)) {
				continue;
			}
			targets.push(sibling);
		}

		current = parent;
	}

	return targets;
}

export function applyInert(elements: readonly HTMLElement[]): void {
	for (const element of elements) {
		element.setAttribute("inert", "");
	}
}

export function restoreInert(elements: readonly HTMLElement[]): void {
	for (const element of elements) {
		element.removeAttribute("inert");
	}
}
