import {
	type CSSProperties,
	type ElementType,
	type ReactElement,
	type KeyboardEvent as ReactKeyboardEvent,
	type ReactNode,
	type PointerEvent as ReactPointerEvent,
	type RefObject,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";
import {FocusScope, useFocusManager} from "react-aria";

import {Heading, HeadingContent, useHeadingElement} from "../../headings";
import {translate} from "../../helpers/i18n";
import useFocusScopeTarget from "../../hooks/useFocusScopeTarget";
import useOverlayDismiss, {
	type EscapeDismissMode,
	shouldDismissOnEscape,
} from "../../hooks/useOverlayDismiss";
import CloseOverlayButton from "../close-overlay-button";
import {
	SNAP_EPSILON_PX,
	type SnapHeights,
	clampDragHeight,
	defaultViewportSnapHeights,
	isAtOrAboveSnap,
	nearestSnapHeight,
	resolveSnapAfterDrag,
	snapIndexForHeight,
} from "./snap";

const TAP_MOVE_THRESHOLD_PX = 8;

export type BottomSheetProps = {
	/** When false, renders nothing. */
	open?: boolean;
	/**
	 * Ascending snap heights in px, or a factory (re-run on window resize).
	 * Defaults to viewport-relative collapsed / peek / medium / max.
	 */
	snaps?: SnapHeights | (() => SnapHeights);
	/** Initial snap index when uncontrolled (default 1 = peek when using defaults). */
	defaultSnapIndex?: number;
	/** Controlled snap index. */
	snapIndex?: number;
	onSnapChange?: (index: number, height: number) => void;
	/** Called whenever pixel height changes (including during drag). */
	onHeightChange?: (height: number) => void;
	/**
	 * Body scrolls only when height is at/above this snap index.
	 * Default: `snaps.length - 2` (medium when using four defaults).
	 */
	scrollFromSnapIndex?: number;
	/** Fallback region accessible name when no title is rendered. */
	label: string;
	/** Accessible name for the resize separator. */
	resizeLabel?: string;
	/** Custom value text for the current snap. Defaults to a translated "Position n of m". */
	snapValueText?: (index: number, height: number) => string;
	/** Escape and close button. */
	onDismiss?: () => void;
	/** Escape only within the sheet by default; document restores the legacy scope. */
	dismissOnEscape?: EscapeDismissMode;
	/** Opt in after a user action: true focuses the title (or region); a ref selects another target. */
	initialFocus?: boolean | RefObject<HTMLElement | null>;
	/** Opt in to focus return on close/unmount: true uses the opener; a ref overrides it. */
	restoreFocus?: boolean | RefObject<HTMLElement | null>;
	hideCloseButton?: boolean;
	closeLabel?: string;
	title?: ReactNode;
	/** Explicit title element; the non-modal sheet otherwise inherits the page heading scope. */
	headlineAs?: ElementType;
	children?: ReactNode;
	className?: string;
	style?: CSSProperties;
	/** Fired when height crosses ~`tallRatio` of the viewport (host chrome declutter). */
	onTallChange?: (tall: boolean) => void;
	tallRatio?: number;
};

// Viewport-dependent factories run after commit. The initial HTML uses the
// same fallback on the server and client, or the explicit serializable snaps.
function initialSnaps(snaps: BottomSheetProps["snaps"]): SnapHeights {
	return Array.isArray(snaps) && snaps.length > 0
		? snaps
		: defaultViewportSnapHeights(800);
}

function resolveSnaps(snaps: BottomSheetProps["snaps"]): SnapHeights {
	if (typeof snaps === "function") {
		return snaps();
	}
	if (snaps && snaps.length > 0) {
		return snaps;
	}
	return defaultViewportSnapHeights();
}

/**
 * In-flow bottom sheet with snap points and an APG Window Splitter handle.
 *
 * Not a modal — does not trap focus or dim the rest of the page. Hosts wire
 * open/dismiss and optional map resize. Dragging down does not dismiss.
 *
 * https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/
 */
export default function BottomSheet({
	open = true,
	snaps: snapsProp,
	defaultSnapIndex = 1,
	snapIndex: controlledSnapIndex,
	onSnapChange,
	onHeightChange,
	scrollFromSnapIndex,
	label,
	resizeLabel = translate("ui.bottom-sheet.resize"),
	snapValueText,
	onDismiss,
	dismissOnEscape = "within",
	initialFocus = false,
	restoreFocus = false,
	hideCloseButton = false,
	closeLabel,
	title,
	headlineAs,
	children,
	className,
	style,
	onTallChange,
	tallRatio = 0.6,
}: BottomSheetProps): ReactElement | null {
	const Headline = useHeadingElement("sheetTitle", "h2", headlineAs);
	const bodyId = useId();
	const titleId = useId();
	const rootRef = useRef<HTMLDivElement>(null);
	const parentFocusManager = useFocusManager();
	const titleRef = useRef<HTMLHeadingElement>(null);
	const bodyRef = useRef<HTMLDivElement>(null);
	const heightRef = useRef(0);
	const dragRef = useRef<{
		pointerId: number;
		startY: number;
		startHeight: number;
		didDrag: boolean;
	} | null>(null);

	const [heights, setHeights] = useState(() => initialSnaps(snapsProp));
	const [uncontrolledIndex, setUncontrolledIndex] = useState(() => {
		const initial = initialSnaps(snapsProp);
		return Math.max(0, Math.min(initial.length - 1, defaultSnapIndex));
	});
	const [isDragging, setIsDragging] = useState(false);
	const [dragHeight, setDragHeight] = useState<number | null>(null);

	const isControlled = controlledSnapIndex !== undefined;
	const snapIndex = isControlled
		? Math.max(0, Math.min(heights.length - 1, controlledSnapIndex))
		: uncontrolledIndex;

	const settledHeight = heights[snapIndex] ?? heights[0] ?? 0;
	const height = dragHeight ?? settledHeight;

	useEffect(() => {
		heightRef.current = height;
	}, [height]);

	const scrollFrom = scrollFromSnapIndex ?? Math.max(0, heights.length - 2);
	const scrollFromHeight = heights[scrollFrom] ?? settledHeight;
	const canScrollContent = isAtOrAboveSnap(height, scrollFromHeight);

	const applySnapIndex = useCallback(
		(index: number) => {
			const snaps = heights;
			const clamped = Math.max(0, Math.min(snaps.length - 1, index));
			const nextHeight = snaps[clamped] ?? 0;
			if (!isControlled) {
				setUncontrolledIndex(clamped);
			}
			setDragHeight(null);
			onSnapChange?.(clamped, nextHeight);
			onHeightChange?.(nextHeight);
		},
		[heights, isControlled, onHeightChange, onSnapChange],
	);

	const applyHeightPx = useCallback(
		(next: number) => {
			const snaps = heights;
			const index = snapIndexForHeight(next, snaps);
			const snapped = snaps[index] ?? next;
			if (!isControlled) {
				setUncontrolledIndex(index);
			}
			setDragHeight(null);
			onSnapChange?.(index, snapped);
			onHeightChange?.(snapped);
		},
		[heights, isControlled, onHeightChange, onSnapChange],
	);

	// Keep snaps in sync with viewport / factory.
	useEffect(() => {
		if (!open) {
			return;
		}

		const refresh = () => {
			const next = resolveSnaps(snapsProp);
			setHeights(next);
			if (!isControlled) {
				setUncontrolledIndex((current) =>
					snapIndexForHeight(
						nearestSnapHeight(next[current] ?? next[0] ?? 0, next),
						next,
					),
				);
			}
		};

		refresh();
		window.addEventListener("resize", refresh);
		return () => window.removeEventListener("resize", refresh);
	}, [isControlled, open, snapsProp]);

	useEffect(() => {
		if (!open) {
			onTallChange?.(false);
			return;
		}
		const tall =
			typeof window !== "undefined" &&
			height >= window.innerHeight * tallRatio - SNAP_EPSILON_PX;
		onTallChange?.(tall);
	}, [height, onTallChange, open, tallRatio]);

	useOverlayDismiss({
		isActive: open && Boolean(onDismiss) && dismissOnEscape === "document",
		onDismiss: () => onDismiss?.(),
		excludeRefs: [rootRef],
		dismissOnOutsidePointer: false,
		dismissOnEscape,
	});

	const onMovePointerDown = useCallback(
		(event: ReactPointerEvent<HTMLDivElement>) => {
			if (event.button !== 0) {
				return;
			}
			event.preventDefault();
			event.currentTarget.setPointerCapture(event.pointerId);
			dragRef.current = {
				pointerId: event.pointerId,
				startY: event.clientY,
				startHeight: heightRef.current,
				didDrag: false,
			};
		},
		[],
	);

	const onMovePointerMove = useCallback(
		(event: ReactPointerEvent<HTMLDivElement>) => {
			const drag = dragRef.current;
			if (!drag || drag.pointerId !== event.pointerId) {
				return;
			}
			const travel = Math.abs(event.clientY - drag.startY);
			if (!drag.didDrag) {
				if (travel < TAP_MOVE_THRESHOLD_PX) {
					return;
				}
				drag.didDrag = true;
				setIsDragging(true);
			}
			const raw = drag.startHeight + (drag.startY - event.clientY);
			const next = clampDragHeight(raw, heights);
			setDragHeight(next);
			onHeightChange?.(next);
		},
		[heights, onHeightChange],
	);

	const endMoveDrag = useCallback(
		(event: ReactPointerEvent<HTMLDivElement>) => {
			const drag = dragRef.current;
			if (!drag || drag.pointerId !== event.pointerId) {
				return;
			}
			dragRef.current = null;
			setIsDragging(false);
			try {
				event.currentTarget.releasePointerCapture(event.pointerId);
			} catch {
				// already released
			}

			if (!drag.didDrag) {
				const next = (snapIndex + 1) % Math.max(heights.length, 1);
				applySnapIndex(next);
				return;
			}

			const raw = drag.startHeight + (drag.startY - event.clientY);
			applyHeightPx(resolveSnapAfterDrag(raw, drag.startHeight, heights));
		},
		[applyHeightPx, applySnapIndex, heights, snapIndex],
	);

	const onSeparatorKeyDown = useCallback(
		(event: ReactKeyboardEvent<HTMLDivElement>) => {
			if (event.key === "ArrowUp") {
				event.preventDefault();
				applySnapIndex(snapIndex + 1);
			} else if (event.key === "ArrowDown") {
				event.preventDefault();
				if (snapIndex > 0) {
					applySnapIndex(snapIndex - 1);
				}
			} else if (event.key === "Home") {
				event.preventDefault();
				applySnapIndex(0);
			} else if (event.key === "End") {
				event.preventDefault();
				applySnapIndex(heights.length - 1);
			}
		},
		[applySnapIndex, heights.length, snapIndex],
	);

	if (!open || heights.length === 0) {
		return null;
	}

	const minH = heights[0]!;
	const maxH = heights[heights.length - 1]!;
	const valueText =
		snapValueText?.(snapIndex, height) ??
		translate("ui.bottom-sheet.snap-value")
			.replace("{position}", String(snapIndex + 1))
			.replace("{count}", String(heights.length));

	const rootClass = [
		"ms3-bottom-sheet",
		isDragging ? "ms3-bottom-sheet--dragging" : "",
		canScrollContent
			? "ms3-bottom-sheet--scrollable"
			: "ms3-bottom-sheet--expand-on-scroll",
		className ?? "",
	]
		.filter(Boolean)
		.join(" ");

	return (
		<FocusScope
			autoFocus={Boolean(initialFocus)}
			restoreFocus={restoreFocus === true}
		>
			{/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Delegate Escape from interactive descendants of the region. */}
			<div
				ref={rootRef}
				tabIndex={-1}
				className={rootClass}
				style={{...style, height}}
				data-snap-index={snapIndex}
				role="region"
				aria-label={title == null ? label : undefined}
				aria-labelledby={title != null ? titleId : undefined}
				onKeyDown={(event) => {
					if (
						onDismiss &&
						dismissOnEscape !== false &&
						shouldDismissOnEscape(
							event.nativeEvent,
							rootRef.current,
						)
					) {
						event.preventDefault();
						onDismiss();
					}
				}}
			>
				<header className="ms3-bottom-sheet__header">
					{/*
				  Focusable separator (window splitter). jsx-a11y treats separator
				  as non-interactive; tabindex + handlers are required by APG.
				  https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/
				*/}
					{/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- APG focusable separator */}
					<div
						className="ms3-bottom-sheet__move"
						role="separator"
						aria-orientation="horizontal"
						aria-controls={bodyId}
						aria-describedby={title != null ? titleId : undefined}
						aria-valuemin={minH}
						aria-valuemax={maxH}
						aria-valuenow={height}
						aria-valuetext={valueText}
						aria-label={resizeLabel}
						tabIndex={0}
						onPointerDown={onMovePointerDown}
						onPointerMove={onMovePointerMove}
						onPointerUp={endMoveDrag}
						onPointerCancel={endMoveDrag}
						onKeyDown={onSeparatorKeyDown}
					>
						<div
							className="ms3-bottom-sheet__handle"
							aria-hidden="true"
						/>
					</div>
					{/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
					{title != null ? (
						<Heading
							as={Headline}
							ref={titleRef}
							id={titleId}
							tabIndex={-1}
							className="ms3-bottom-sheet__title"
						>
							{title}
						</Heading>
					) : null}
					{hideCloseButton || !onDismiss ? null : (
						<CloseOverlayButton
							label={closeLabel}
							onClose={onDismiss}
						/>
					)}
				</header>
				<div
					id={bodyId}
					ref={bodyRef}
					className="ms3-bottom-sheet__body"
				>
					<HeadingContent
						headingAs={title != null ? Headline : undefined}
					>
						{children}
					</HeadingContent>
				</div>
			</div>
			<SheetFocusTarget
				scopeRef={rootRef}
				initialFocusRef={
					initialFocus === true
						? title != null
							? titleRef
							: rootRef
						: initialFocus || undefined
				}
				fallbackFocus={
					restoreFocus && parentFocusManager
						? () => {
								parentFocusManager.focusFirst();
							}
						: undefined
				}
				restoreFocusRef={
					typeof restoreFocus === "object" ? restoreFocus : undefined
				}
			/>
		</FocusScope>
	);
}

/** Must mount inside FocusScope so explicit targeting follows the same open/close lifetime. */
function SheetFocusTarget(props: Parameters<typeof useFocusScopeTarget>[0]) {
	useFocusScopeTarget(props);
	return null;
}
