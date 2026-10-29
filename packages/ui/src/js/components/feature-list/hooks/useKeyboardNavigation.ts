import type {FocusEventHandler, KeyboardEventHandler, Ref} from "react";
import {useCallback, useMemo, useRef} from "react";
import {mergeRefs} from "react-aria";

import {
	APP_EVENT_FOCUS_FEATURE_LIST,
	useAppChannelEventListener,
} from "../../../app-channel";

const ROW_SELECTOR = "[data-ms3-list-nav]:not(:disabled)";

/**
 * Keep one row in the Tab order, including when rows are filtered or regrouped.
 * `enabled` only controls the historic PageUp/PageDown shortcuts.
 */
function useKeyboardNavigation<T extends HTMLElement>(
	enabled: boolean,
	forwardedRef: Ref<T>,
) {
	const containerRef = useRef<T | null>(null);
	const currentRowRef = useRef<HTMLElement | undefined>(undefined);
	const observerRef = useRef<MutationObserver | null>(null);

	const updateTabStops = useCallback((preferredRow?: HTMLElement) => {
		const rows = [
			...(containerRef.current?.querySelectorAll<HTMLElement>(
				ROW_SELECTOR,
			) || []),
		];
		const currentRow =
			preferredRow && rows.includes(preferredRow)
				? preferredRow
				: currentRowRef.current && rows.includes(currentRowRef.current)
					? currentRowRef.current
					: rows[0];
		currentRowRef.current = currentRow;
		rows.forEach((row) => {
			row.tabIndex = row === currentRow ? 0 : -1;
		});
		return rows;
	}, []);

	const ref = useCallback(
		(container: T | null) => {
			observerRef.current?.disconnect();
			containerRef.current = container;
			updateTabStops();
			if (container) {
				const observer = new MutationObserver(() => updateTabStops());
				observer.observe(container, {childList: true, subtree: true});
				observerRef.current = observer;
			}
		},
		[updateTabStops],
	);

	const mergedRef = useMemo(
		() => mergeRefs(forwardedRef, ref),
		[forwardedRef, ref],
	);

	useAppChannelEventListener(
		APP_EVENT_FOCUS_FEATURE_LIST,
		useCallback(() => {
			updateTabStops();
			currentRowRef.current?.focus({preventScroll: true});
		}, [updateTabStops]),
	);

	const onFocusCapture = useCallback<FocusEventHandler<HTMLElement>>(
		(ev) => {
			if (ev.target.matches(ROW_SELECTOR)) {
				updateTabStops(ev.target);
			}
		},
		[updateTabStops],
	);

	const onKeyDown = useCallback<KeyboardEventHandler<HTMLElement>>(
		(ev) => {
			// Let controls in inline details keep their own keyboard behaviour.
			if (
				ev.defaultPrevented ||
				ev.altKey ||
				ev.ctrlKey ||
				ev.metaKey ||
				!(ev.target instanceof HTMLElement) ||
				!ev.target.matches(ROW_SELECTOR)
			) {
				return;
			}
			const rows = updateTabStops(ev.target);
			const index = rows.indexOf(ev.target);
			if (index < 0) {
				return;
			}

			let nextIndex;
			if (ev.key === "ArrowUp") {
				nextIndex = (index + rows.length - 1) % rows.length;
			} else if (ev.key === "ArrowDown") {
				nextIndex = (index + 1) % rows.length;
			} else if (ev.key === "Home" || (enabled && ev.key === "PageUp")) {
				nextIndex = 0;
			} else if (ev.key === "End" || (enabled && ev.key === "PageDown")) {
				nextIndex = rows.length - 1;
			} else {
				return;
			}

			ev.preventDefault();
			updateTabStops(rows[nextIndex]);
			rows[nextIndex]?.focus();
		},
		[enabled, updateTabStops],
	);

	return {ref: mergedRef, onFocusCapture, onKeyDown};
}

export default useKeyboardNavigation;
