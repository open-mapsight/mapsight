/**
 * Document scroll helpers for list ↔ mapOnly restore.
 *
 * Clicking a list row can scroll that row into view before React's click
 * handler runs, so selection must remember scroll at pointerdown.
 */

export function getDocumentScroll(): number {
	if (typeof window === "undefined") {
		return 0;
	}

	return (
		window.document.documentElement.scrollTop ||
		window.document.body.scrollTop ||
		0
	);
}

/** Drop unused pointerdown captures so keyboard select does not reuse them. */
const SCROLL_CAPTURE_MAX_AGE_MS = 2000;

let scrollAtPointerDown: number | null = null;
let scrollAtPointerDownAt = 0;

/** Call from list-item pointerdown before focus/click scroll adjustment. */
export function rememberDocumentScrollForSelection(): void {
	scrollAtPointerDown = getDocumentScroll();
	scrollAtPointerDownAt = Date.now();
}

/** Read scroll captured at pointerdown; falls back to current scroll. */
export function consumeDocumentScrollForSelection(): number {
	const age = Date.now() - scrollAtPointerDownAt;
	const captured = scrollAtPointerDown;
	const stale = captured === null || age > SCROLL_CAPTURE_MAX_AGE_MS;
	scrollAtPointerDown = null;
	scrollAtPointerDownAt = 0;
	return stale ? getDocumentScroll() : captured;
}
