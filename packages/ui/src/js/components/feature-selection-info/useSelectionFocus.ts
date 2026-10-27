import {useCallback, useRef} from "react";

function focusVisible(element: HTMLElement | null) {
	if (
		!element?.isConnected ||
		element.closest('[inert], [hidden], [aria-hidden="true"]')
	) {
		return false;
	}
	for (
		let ancestor: HTMLElement | null = element;
		ancestor;
		ancestor = ancestor.parentElement
	) {
		const style = getComputedStyle(ancestor);
		if (style.display === "none" || style.visibility === "hidden") {
			return false;
		}
	}
	if (!element.hasAttribute("tabindex") && element.matches(".ms3-list")) {
		element.tabIndex = -1;
	}
	element.focus({preventScroll: true});
	return document.activeElement === element;
}

/** Capture the origin before the details autofocus; restore after the closing render. */
export default function useSelectionFocus() {
	const originRef = useRef<HTMLElement | null>(null);
	const scopeRef = useRef<Element | null>(null);
	const frameRef = useRef<number | null>(null);

	const rememberOrigin = useCallback((panel: HTMLElement) => {
		scopeRef.current = panel.closest(".ms3-wrapper");
		const active = document.activeElement;
		if (active instanceof HTMLElement && !panel.contains(active)) {
			originRef.current = active.closest(".ms3-list") ? active : null;
		}
	}, []);

	const restoreFocus = useCallback(() => {
		if (frameRef.current !== null) {
			cancelAnimationFrame(frameRef.current);
		}
		const scope = scopeRef.current;
		const origin = originRef.current;
		frameRef.current = requestAnimationFrame(() => {
			frameRef.current = null;
			if (focusVisible(origin)) {
				return;
			}
			for (const list of scope?.querySelectorAll<HTMLElement>(
				".ms3-list",
			) ?? []) {
				if (focusVisible(list)) {
					return;
				}
			}
			focusVisible(
				scope?.querySelector<HTMLElement>(".ms3-map-target") ?? null,
			);
		});
	}, []);

	return {rememberOrigin, restoreFocus};
}
