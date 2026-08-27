import {
	type CSSProperties,
	type ReactElement,
	type ReactNode,
	useId,
} from "react";
import {createPortal} from "react-dom";

import useNativeDialog from "../hooks/useNativeDialog";
import CloseOverlayButton from "./close-overlay-button";

export type NativeDialogProps = {
	isOpen: boolean;
	onClose: () => void;
	/** Visible dialog title (also used for `aria-labelledby` when `labelledBy` is omitted). */
	title?: ReactNode;
	/** Explicit `aria-labelledby` id. Defaults to a generated id on the title heading. */
	labelledBy?: string;
	/** Accessible name when there is no visible title (`aria-label`). */
	"aria-label"?: string;
	closeLabel?: string;
	/** When true (default), backdrop click dismisses. Escape always dismisses via `onClose`. */
	dismissOnBackdrop?: boolean;
	/**
	 * Portal target. `true` / omitted with `portal` default false renders in place.
	 * Pass `true` to use `document.body`, or an element.
	 */
	portal?: boolean | HTMLElement;
	className?: string;
	style?: CSSProperties;
	/** Extra class on the inner sheet wrapper (scrollable panel inside the dialog). */
	sheetClassName?: string;
	children?: ReactNode;
	/** Optional header actions (rendered before the close button). */
	headerActions?: ReactNode;
	/** Hide the default close button (host provides its own). */
	hideCloseButton?: boolean;
};

/**
 * Controlled native modal dialog (`<dialog showModal>`).
 *
 * Shell only — hosts supply title, body, and styling. Prefer this for modal
 * drawers/sheets over react-modal when a bottom-sheet layout is needed.
 *
 * APG Dialog (Modal): https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 */
export default function NativeDialog({
	isOpen,
	onClose,
	title,
	labelledBy,
	"aria-label": ariaLabel,
	closeLabel,
	dismissOnBackdrop = true,
	portal = false,
	className,
	style,
	sheetClassName,
	children,
	headerActions,
	hideCloseButton = false,
}: NativeDialogProps): ReactElement | null {
	const generatedTitleId = useId();
	const titleId =
		labelledBy ?? (title != null ? generatedTitleId : undefined);
	const {dialogRef, dialogProps} = useNativeDialog({
		isOpen,
		onClose,
		dismissOnBackdrop,
	});

	if (typeof document === "undefined") {
		return null;
	}

	// Keep the node mounted while closed so the ref syncs open/close reliably.
	const dialog = (
		<dialog
			ref={dialogRef}
			className={className}
			style={style}
			aria-labelledby={titleId}
			aria-label={titleId ? undefined : ariaLabel}
			{...dialogProps}
		>
			<div className={sheetClassName}>
				{title != null || !hideCloseButton || headerActions != null ? (
					<header className="ms3-native-dialog__header">
						{title != null ? (
							<h2
								className="ms3-native-dialog__title"
								id={titleId}
							>
								{title}
							</h2>
						) : null}
						{headerActions}
						{hideCloseButton ? null : (
							<CloseOverlayButton
								label={closeLabel}
								onClose={onClose}
							/>
						)}
					</header>
				) : null}
				{children}
			</div>
		</dialog>
	);

	if (portal === false) {
		return dialog;
	}

	const target = portal === true ? document.body : portal;
	return createPortal(dialog, target);
}
