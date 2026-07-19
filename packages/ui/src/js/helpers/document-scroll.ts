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

let scrollAtPointerDown: number | null = null;

/** Call from list-item pointerdown before focus/click scroll adjustment. */
export function rememberDocumentScrollForSelection(): void {
	scrollAtPointerDown = getDocumentScroll();
}

/** Read scroll captured at pointerdown; falls back to current scroll. */
export function consumeDocumentScrollForSelection(): number {
	const value =
		scrollAtPointerDown === null
			? getDocumentScroll()
			: scrollAtPointerDown;
	scrollAtPointerDown = null;
	return value;
}
