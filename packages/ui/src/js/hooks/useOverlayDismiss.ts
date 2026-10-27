import type {RefObject} from "react";
import {useEffect} from "react";

export type EscapeDismissMode = "within" | "document" | false;

/** Bubble-phase Escape handling: nested dialogs and handled events belong to their owner. */
export function shouldDismissOnEscape(
	event: KeyboardEvent,
	root: Element | null,
	mode: EscapeDismissMode = "within",
) {
	if (!mode || event.key !== "Escape" || event.defaultPrevented || !root) {
		return false;
	}
	if (!(event.target instanceof Element)) {
		return mode === "document" && event.target === document;
	}
	if (mode === "within" && !root.contains(event.target)) {
		return false;
	}
	const dialog = event.target.closest(
		'dialog[open], [role="dialog"], [role="alertdialog"], [aria-modal="true"]',
	);
	return !dialog || dialog === root || dialog.contains(root);
}

type UseOverlayDismissOptions = {
	isActive: boolean;
	onDismiss: () => void;
	excludeRefs: Array<RefObject<Element | null>>;
	/** Escape is scoped to these refs (defaults to excludeRefs, including triggers). */
	escapeRefs?: Array<RefObject<Element | null>>;
	dismissOnEscape?: EscapeDismissMode;
	dismissOnOutsidePointer?: boolean;
};

/**
 * Closes on outside pointer down or scoped Escape without focus-trap `onDeactivate`.
 * Escape defaults to the excluded refs (panel and triggers); use "document" for legacy scope.
 * Components nested in a focus trap should handle Escape in their React bubble handler
 * with shouldDismissOnEscape, so preventDefault reaches the outer trap first.
 */
export default function useOverlayDismiss({
	isActive,
	onDismiss,
	excludeRefs,
	escapeRefs = excludeRefs,
	dismissOnEscape = "within",
	dismissOnOutsidePointer = true,
}: UseOverlayDismissOptions) {
	useEffect(() => {
		if (!isActive) {
			return;
		}

		const isInsideExcluded = (target: EventTarget | null) => {
			if (!(target instanceof Node)) {
				return false;
			}

			return excludeRefs.some((ref) => ref.current?.contains(target));
		};

		const onPointerDown = (event: PointerEvent) => {
			if (isInsideExcluded(event.target)) {
				return;
			}

			onDismiss();
		};

		const onKeyDown = (event: KeyboardEvent) => {
			if (
				escapeRefs.some((ref) =>
					shouldDismissOnEscape(event, ref.current, dismissOnEscape),
				)
			) {
				event.preventDefault();
				onDismiss();
			}
		};

		if (dismissOnOutsidePointer) {
			document.addEventListener("pointerdown", onPointerDown, true);
		}
		document.addEventListener("keydown", onKeyDown);

		return () => {
			document.removeEventListener("pointerdown", onPointerDown, true);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [
		dismissOnEscape,
		dismissOnOutsidePointer,
		escapeRefs,
		excludeRefs,
		isActive,
		onDismiss,
	]);
}
