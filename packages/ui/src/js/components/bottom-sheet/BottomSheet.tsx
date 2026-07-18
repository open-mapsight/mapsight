import {
	type CSSProperties,
	type ReactElement,
	type KeyboardEvent as ReactKeyboardEvent,
	type ReactNode,
	type PointerEvent as ReactPointerEvent,
	useCallback,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";

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
	/** Region accessible name. */
	label: string;
	/** Accessible name for the resize separator. */
	resizeLabel?: string;
	/** Optional valuetext for the current snap (screen readers). */
	snapValueText?: (index: number, height: number) => string;
	/** Escape and close button. */
	onDismiss?: () => void;
	hideCloseButton?: boolean;
	closeLabel?: string;
	title?: ReactNode;
	children?: ReactNode;
	className?: string;
	style?: CSSProperties;
	/** Fired when height crosses ~`tallRatio` of the viewport (host chrome declutter). */
	onTallChange?: (tall: boolean) => void;
	tallRatio?: number;
};

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
	resizeLabel = "Resize",
	snapValueText,
	onDismiss,
	hideCloseButton = false,
	closeLabel,
	title,
	children,
	className,
	style,
	onTallChange,
	tallRatio = 0.6,
}: BottomSheetProps): ReactElement | null {
	const bodyId = useId();
	const bodyRef = useRef<HTMLDivElement>(null);
	const heightRef = useRef(0);
	const dragRef = useRef<{
		pointerId: number;
		startY: number;
		startHeight: number;
		didDrag: boolean;
	} | null>(null);

	const [heights, setHeights] = useState(() => resolveSnaps(snapsProp));
	const [uncontrolledIndex, setUncontrolledIndex] = useState(() => {
		const initial = resolveSnaps(snapsProp);
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

	useEffect(() => {
		if (!open || !onDismiss) {
			return;
		}
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onDismiss();
			}
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [onDismiss, open]);

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
	const valueText = snapValueText?.(snapIndex, height);

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
		<div
			className={rootClass}
			style={{...style, height}}
			data-snap-index={snapIndex}
			role="region"
			aria-label={label}
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
					{title != null ? (
						<h2 className="ms3-bottom-sheet__title">{title}</h2>
					) : null}
				</div>
				{/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
				{hideCloseButton || !onDismiss ? null : (
					<CloseOverlayButton
						label={closeLabel}
						onClose={onDismiss}
					/>
				)}
			</header>
			<div id={bodyId} ref={bodyRef} className="ms3-bottom-sheet__body">
				{children}
			</div>
		</div>
	);
}
