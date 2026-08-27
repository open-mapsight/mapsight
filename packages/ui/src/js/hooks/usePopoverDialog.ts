import {
	type CSSProperties,
	type HTMLAttributes,
	type RefObject,
	useMemo,
} from "react";
import {
	mergeProps,
	useDialog,
	useOverlay,
	useOverlayPosition,
} from "react-aria";

/** Subset of react-aria placements used by Mapsight hosts. */
export type PopoverDialogPlacement =
	| "bottom"
	| "bottom left"
	| "bottom right"
	| "bottom start"
	| "bottom end"
	| "top"
	| "top left"
	| "top right"
	| "top start"
	| "top end"
	| "left"
	| "left top"
	| "left bottom"
	| "start"
	| "start top"
	| "start bottom"
	| "right"
	| "right top"
	| "right bottom"
	| "end"
	| "end top"
	| "end bottom";

export type UsePopoverDialogOptions = {
	isOpen: boolean;
	onClose: () => void;
	triggerRef: RefObject<Element | null>;
	popoverRef: RefObject<HTMLElement | null>;
	placement?: PopoverDialogPlacement;
	offset?: number;
	isDismissable?: boolean;
	shouldCloseOnBlur?: boolean;
	shouldFlip?: boolean;
	/** Optional id for `aria-controls` on the trigger. */
	popoverId?: string;
	/** Explicit `aria-labelledby` when the title lives outside `titleProps`. */
	labelledBy?: string;
	/** Accessible name when there is no visible title (`aria-label`). */
	"aria-label"?: string;
};

export type UsePopoverDialogResult = {
	/** Spread onto the popover panel element. */
	popoverProps: HTMLAttributes<HTMLElement> & {
		style?: CSSProperties;
	};
	/** Spread onto the dialog title element (e.g. heading). */
	titleProps: HTMLAttributes<HTMLElement>;
	/** Props for the trigger: expanded / haspopup / controls. */
	triggerAriaProps: {
		"aria-expanded": boolean;
		"aria-haspopup": "dialog";
		"aria-controls"?: string;
	};
	updatePosition: () => void;
};

/**
 * Non-modal dialog popover: dismiss + position + dialog naming (react-aria).
 *
 * Pair with `FocusScope`, `OverlayContainer`, and `DismissButton` (see
 * `PopoverDialog`), or wire those yourself for custom chrome.
 *
 * Matches the list-options / filter-panel pattern. Prefer `useNativeDialog`
 * for modal drawers instead.
 */
export default function usePopoverDialog({
	isOpen,
	onClose,
	triggerRef,
	popoverRef,
	placement = "bottom start",
	offset = 6,
	isDismissable = true,
	shouldCloseOnBlur = false,
	shouldFlip = true,
	popoverId,
	labelledBy,
	"aria-label": ariaLabel,
}: UsePopoverDialogOptions): UsePopoverDialogResult {
	const {overlayProps} = useOverlay(
		{
			isDismissable,
			isOpen,
			onClose,
			shouldCloseOnBlur,
		},
		popoverRef,
	);
	const {dialogProps, titleProps} = useDialog(
		{
			"aria-label": ariaLabel,
			"aria-labelledby": labelledBy,
		},
		popoverRef,
	);
	const overlayPosition = useOverlayPosition({
		targetRef: triggerRef,
		overlayRef: popoverRef,
		placement,
		offset,
		isOpen,
		shouldFlip,
	});
	const {overlayProps: positionProps} = overlayPosition;

	const popoverProps = useMemo(
		() =>
			mergeProps(positionProps, overlayProps, dialogProps, {
				id: popoverId,
			}) as UsePopoverDialogResult["popoverProps"],
		[dialogProps, overlayProps, popoverId, positionProps],
	);

	const triggerAriaProps = useMemo(
		() => ({
			"aria-expanded": isOpen,
			"aria-haspopup": "dialog" as const,
			...(isOpen && popoverId ? {"aria-controls": popoverId} : {}),
		}),
		[isOpen, popoverId],
	);

	return {
		popoverProps,
		titleProps,
		triggerAriaProps,
		updatePosition: () => {
			overlayPosition.updatePosition();
		},
	};
}
