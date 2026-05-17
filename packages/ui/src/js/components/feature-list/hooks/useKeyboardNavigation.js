import {useCallback} from "react";

import {
	APP_EVENT_FOCUS_FEATURE_LIST,
	useAppChannelEventListener,
} from "../../helping/app-channel";

const DEFAULT_SELECTOR_ITEM = ".ms3-list__item";
const DEFAULT_SELECTOR_BUTTON = ".ms3-list__button";

/**
 * @param {boolean} enabled enable keyboard navigation
 * @param {import('react').MutableRefObject<HTMLElement>} ref ref of the list container
 * @returns {{onKeyDown: (KeyboardEvent) => void, tabIndex: number}|{onKeyDown: undefined, tabIndex: undefined}} props that should be applied to the container
 */
function useKeyboardNavigation(enabled, ref) {
	useAppChannelEventListener(
		APP_EVENT_FOCUS_FEATURE_LIST,
		useCallback(() => {
			if (!enabled) {
				moveFocus(ref.current, "first", {preventScroll: true});
			}
		}, [enabled, ref]),
	);

	/** @type {(KeyboardEvent) => void} */
	const onKeyDown = useCallback(
		(ev) => {
			if (!enabled) {
				return;
			}

			if (ev.key === "ArrowUp") {
				ev.preventDefault();
				moveFocus(ref.current, -1);
			} else if (ev.key === "ArrowDown") {
				ev.preventDefault();
				moveFocus(ref.current, 1);
			} else if (ev.key === "PageUp") {
				ev.preventDefault();
				moveFocus(ref.current, "first");
			} else if (ev.key === "PageDown") {
				ev.preventDefault();
				moveFocus(ref.current, "last");
			}
		},
		[enabled, ref],
	);

	if (!enabled) {
		return {
			tabIndex: undefined,
			onKeyDown: undefined,
		};
	}

	return {
		tabIndex: 0,
		onKeyDown: onKeyDown,
	};
}

/**
 * @param {HTMLElement} container container element
 * @param {"first" | "last" | number} direction direction to move focus in
 * @param {object} [options] options
 * @param {string} [options.selectorItem=".ms3-list__item"] selector for items to navigate between
 * @param {string} [options.selectorButton=".ms3-list__button"] selector for focusable elements to navigate between
 * @param {FocusOptions} [options.focusOptions] focus options
 */
function moveFocus(
	container,
	direction = "first",
	{
		selectorButton = DEFAULT_SELECTOR_BUTTON,
		selectorItem = DEFAULT_SELECTOR_ITEM,
		focusOptions,
	} = {},
) {
	// get buttons in document order
	const buttons = [...container.querySelectorAll(selectorButton)];
	const lastIndex = buttons.length - 1;

	let nextIndex = 0;
	if (direction === "last") {
		nextIndex = lastIndex;
	} else if (typeof direction === "number") {
		const activeElement = document.activeElement;
		if (!activeElement) return;

		if (activeElement === container) {
			nextIndex = direction >= 0 ? 0 : lastIndex;
		} else {
			const startElement = activeElement.matches(selectorButton)
				? activeElement
				: activeElement
						.closest(selectorItem)
						?.querySelector(selectorButton);
			if (!startElement) {
				console.error("No focusable element found");
				return;
			}
			const currentIndex = buttons.indexOf(startElement);
			nextIndex =
				(buttons.length + currentIndex + direction) % buttons.length;
		}
	}

	buttons[nextIndex].focus(focusOptions);
}

export default useKeyboardNavigation;
