import {
	type DialogHTMLAttributes,
	type MouseEvent as ReactMouseEvent,
	type RefObject,
	useCallback,
	useEffect,
	useRef,
} from "react";

export type UseNativeDialogOptions = {
	/** Controlled open state — synced to `HTMLDialogElement.showModal()` / `close()`. */
	isOpen: boolean;
	/** Called on Escape (`cancel`) and, when enabled, backdrop click. */
	onClose: () => void;
	/**
	 * When true (default), clicking the dialog backdrop (the `<dialog>` element
	 * itself, not its children) calls `onClose`. Keyboard equivalent is Escape.
	 */
	dismissOnBackdrop?: boolean;
};

export type UseNativeDialogResult = {
	dialogRef: RefObject<HTMLDialogElement | null>;
	/** Spread onto `<dialog>` — includes cancel / close / optional backdrop handlers. */
	dialogProps: Pick<
		DialogHTMLAttributes<HTMLDialogElement>,
		"onCancel" | "onClose" | "onClick"
	>;
};

/**
 * Controlled native `<dialog>` via `showModal()` / `close()`.
 *
 * Prefer this over wrapping drawers in react-aria modal overlays: the platform
 * dialog already provides focus trapping, backdrop inertness, and Escape.
 *
 * APG Dialog (Modal): https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 */
export default function useNativeDialog({
	isOpen,
	onClose,
	dismissOnBackdrop = true,
}: UseNativeDialogOptions): UseNativeDialogResult {
	const dialogRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) {
			return;
		}

		if (isOpen && !dialog.open) {
			dialog.showModal();
			return;
		}

		if (!isOpen && dialog.open) {
			dialog.close();
		}
	}, [isOpen]);

	const onCancel = useCallback<
		NonNullable<DialogHTMLAttributes<HTMLDialogElement>["onCancel"]>
	>(
		(event) => {
			// Keep open state controlled by the host (`isOpen` → effect → close()).
			event.preventDefault();
			onClose();
		},
		[onClose],
	);

	const onClick = useCallback(
		(event: ReactMouseEvent<HTMLDialogElement>) => {
			if (!dismissOnBackdrop) {
				return;
			}
			if (event.target === dialogRef.current) {
				onClose();
			}
		},
		[dismissOnBackdrop, onClose],
	);

	const onNativeClose = useCallback(() => {
		// Host-driven close (`isOpen` → effect → `dialog.close()`) also fires
		// the native `close` event. Ignore that echo; still notify for
		// user-initiated closes (e.g. `<form method="dialog">`).
		if (!isOpen) {
			return;
		}
		onClose();
	}, [isOpen, onClose]);

	// Backdrop `onClick` is pointer-only; Escape uses `onCancel`. jsx-a11y may
	// flag the spread site — that is expected for native <dialog> dismiss.
	// https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
	return {
		dialogRef,
		dialogProps: {
			onCancel,
			onClose: onNativeClose,
			...(dismissOnBackdrop ? {onClick} : {}),
		},
	};
}
