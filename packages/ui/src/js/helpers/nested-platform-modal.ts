/**
 * Platform modals that manage their own focus (native `<dialog>`, react-modal).
 * The overlay-chrome trap must pause so the two do not fight.
 */
export const NESTED_PLATFORM_MODAL_SELECTOR = [
	"dialog[open]",
	".ReactModal__Overlay",
	".ReactModal__Content",
].join(",");

export function isNestedPlatformModalOpen(
	exclude: Element | null = null,
): boolean {
	if (typeof document === "undefined") {
		return false;
	}

	const matches = document.querySelectorAll(NESTED_PLATFORM_MODAL_SELECTOR);
	for (const node of matches) {
		if (node !== exclude) {
			return true;
		}
	}

	return false;
}
