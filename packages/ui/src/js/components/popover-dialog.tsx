import {
	type CSSProperties,
	type ReactElement,
	type ReactNode,
	type RefObject,
	useId,
	useRef,
} from "react";
import {DismissButton, FocusScope, OverlayContainer} from "react-aria";

import usePopoverDialog, {
	type PopoverDialogPlacement,
} from "../hooks/usePopoverDialog";
import CloseOverlayButton from "./close-overlay-button";

export type PopoverDialogProps = {
	isOpen: boolean;
	onClose: () => void;
	triggerRef: RefObject<Element | null>;
	title?: ReactNode;
	/** Explicit id for the panel (also used for trigger `aria-controls`). */
	id?: string;
	placement?: PopoverDialogPlacement;
	offset?: number;
	isDismissable?: boolean;
	shouldCloseOnBlur?: boolean;
	shouldFlip?: boolean;
	className?: string;
	style?: CSSProperties;
	closeLabel?: string;
	hideCloseButton?: boolean;
	children?: ReactNode;
	/**
	 * When false, skip `OverlayContainer` (host already provides a portal root).
	 * Default true.
	 */
	portal?: boolean;
};

/**
 * Non-modal dialog popover shell (focus contain + restore, dismiss, position).
 *
 * Hosts own the trigger button (use `useButton` + `triggerAriaProps` from
 * `usePopoverDialog`, or pass matching `aria-*` manually).
 */
export default function PopoverDialog({
	isOpen,
	onClose,
	triggerRef,
	title,
	id: idProp,
	placement,
	offset,
	isDismissable,
	shouldCloseOnBlur,
	shouldFlip,
	className,
	style,
	closeLabel,
	hideCloseButton = false,
	children,
	portal = true,
}: PopoverDialogProps): ReactElement | null {
	const popoverRef = useRef<HTMLDivElement>(null);
	const generatedId = useId();
	const popoverId = idProp ?? generatedId;
	const {popoverProps, titleProps} = usePopoverDialog({
		isOpen,
		onClose,
		triggerRef,
		popoverRef,
		placement,
		offset,
		isDismissable,
		shouldCloseOnBlur,
		shouldFlip,
		popoverId,
	});

	if (!isOpen) {
		return null;
	}

	const panel = (
		<FocusScope restoreFocus contain>
			<div
				{...popoverProps}
				ref={popoverRef}
				className={className}
				style={{...popoverProps.style, ...style}}
			>
				<DismissButton onDismiss={onClose} />
				{title != null || !hideCloseButton ? (
					<header className="ms3-popover-dialog__header">
						{title != null ? (
							<h3
								{...titleProps}
								className="ms3-popover-dialog__title"
							>
								{title}
							</h3>
						) : null}
						{hideCloseButton ? null : (
							<CloseOverlayButton
								label={closeLabel}
								onClose={onClose}
							/>
						)}
					</header>
				) : null}
				{children}
				<DismissButton onDismiss={onClose} />
			</div>
		</FocusScope>
	);

	if (!portal) {
		return panel;
	}

	return <OverlayContainer>{panel}</OverlayContainer>;
}
