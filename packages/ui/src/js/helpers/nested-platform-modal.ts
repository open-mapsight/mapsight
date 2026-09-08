/**
 * Platform overlays that manage their own focus (native `<dialog>`,
 * react-modal, react-aria popovers). The overlay-chrome trap must pause so
 * the two do not fight.
 *
 * In-chrome `OverlayProvider` wrappers can host a `role="dialog"` without
 * being a nested platform modal. Native `<dialog>` and react-modal still
 * count when they render inside the chrome (`NativeDialog` defaults to
 * in-place).
 */
export const NESTED_PLATFORM_MODAL_SELECTOR = [
	"dialog[open]",
	".ReactModal__Overlay",
	".ReactModal__Content",
	"[data-overlay-container] [role='dialog']",
	"[data-overlay-container] [role='alertdialog']",
].join(",");

function isReactModalMarker(node: Element): boolean {
	return (
		node.classList.contains("ReactModal__Overlay") ||
		node.classList.contains("ReactModal__Content")
	);
}

function isReactAriaOverlayDialog(node: Element): boolean {
	const role = node.getAttribute("role");
	return (
		(role === "dialog" || role === "alertdialog") &&
		node.tagName !== "DIALOG" &&
		!isReactModalMarker(node) &&
		node.closest("[data-overlay-container]") != null
	);
}

export function isNestedPlatformModalOpen(
	exclude: Element | null = null,
): boolean {
	if (typeof document === "undefined") {
		return false;
	}

	const matches = document.querySelectorAll(NESTED_PLATFORM_MODAL_SELECTOR);
	for (const node of matches) {
		if (node === exclude) {
			continue;
		}
		if (exclude?.contains(node) && isReactAriaOverlayDialog(node)) {
			continue;
		}
		return true;
	}

	return false;
}
