/**
 * Platform overlays that manage their own focus (native `<dialog>`,
 * react-modal, react-aria popovers). The overlay-chrome trap must pause so
 * the two do not fight.
 *
 * `[data-overlay-container] [role="dialog"]` is the open popover, not the
 * OverlayProvider wrapper hosts may keep inside the chrome.
 */
export const NESTED_PLATFORM_MODAL_SELECTOR = [
	"dialog[open]",
	".ReactModal__Overlay",
	".ReactModal__Content",
	"[data-overlay-container] [role='dialog']",
].join(",");

export function isNestedPlatformModalOpen(
	exclude: Element | null = null,
): boolean {
	if (typeof document === "undefined") {
		return false;
	}

	const matches = document.querySelectorAll(NESTED_PLATFORM_MODAL_SELECTOR);
	for (const node of matches) {
		if (node === exclude || exclude?.contains(node)) {
			continue;
		}
		return true;
	}

	return false;
}
