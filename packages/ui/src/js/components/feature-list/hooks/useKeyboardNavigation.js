import {useCallback, useMemo, useRef} from "react";
import {mergeRefs} from "react-aria";

import {
	APP_EVENT_FOCUS_FEATURE_LIST,
	useAppChannelEventListener,
} from "../../helping/app-channel";

const ROW_SELECTOR = "[data-ms3-list-nav]:not(:disabled)";

/**
 * Keep one row in the Tab order, including when rows are filtered or regrouped.
 * `enabled` only controls the historic PageUp/PageDown shortcuts.
 * @param {boolean} enabled
 * @param {import("react").Ref<HTMLElement>} forwardedRef
 */
function useKeyboardNavigation(enabled, forwardedRef) {
	const containerRef = useRef(/** @type {HTMLElement | null} */ (null));
	const currentRowRef = useRef(
		/** @type {HTMLElement | undefined} */ (undefined),
	);
	const observerRef = useRef(/** @type {MutationObserver | null} */ (null));

	/** @type {(preferredRow?: HTMLElement) => HTMLElement[]} */
	const updateTabStops = useCallback((preferredRow) => {
		const rows = /** @type {HTMLElement[]} */ ([
			...(containerRef.current?.querySelectorAll(ROW_SELECTOR) || []),
		]);
		const currentRow = rows.includes(preferredRow)
			? preferredRow
			: rows.includes(currentRowRef.current)
				? currentRowRef.current
				: rows[0];
		currentRowRef.current = currentRow;
		rows.forEach((row) => {
			row.tabIndex = row === currentRow ? 0 : -1;
		});
		return rows;
	}, []);

	/** @type {import("react").RefCallback<HTMLElement>} */
	const ref = useCallback(
		(container) => {
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

	/** @type {import("react").FocusEventHandler<HTMLElement>} */
	const onFocusCapture = useCallback(
		(ev) => {
			if (ev.target.matches(ROW_SELECTOR)) {
				updateTabStops(ev.target);
			}
		},
		[updateTabStops],
	);

	/** @type {import("react").KeyboardEventHandler<HTMLElement>} */
	const onKeyDown = useCallback(
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
