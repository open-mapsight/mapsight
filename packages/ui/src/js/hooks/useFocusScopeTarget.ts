import {type RefObject, useLayoutEffect, useRef, useState} from "react";

type Options = {
	scopeRef: RefObject<HTMLElement | null>;
	initialFocusRef?: RefObject<HTMLElement | null>;
	restoreFocusRef?: RefObject<HTMLElement | null>;
	/** Used only if scope restoration leaves focus on the body or an inert opener. */
	fallbackFocus?: () => void;
};

/**
 * FocusScope owns opener restoration. Add explicit target refs and a parent-scope
 * fallback for its one uncovered case: a connected opener that has become inert.
 */
export default function useFocusScopeTarget(props: Options) {
	const [options] = useState(() => ({
		...props,
		opener: typeof document === "undefined" ? null : document.activeElement,
	}));
	const restoreFrame = useRef<number | null>(null);
	useLayoutEffect(() => {
		if (restoreFrame.current !== null) {
			cancelAnimationFrame(restoreFrame.current);
		}
		options.initialFocusRef?.current?.focus({preventScroll: true});
		const scope = options.scopeRef.current;
		return () => {
			if (!options.restoreFocusRef && !options.fallbackFocus) {
				return;
			}
			const active = document.activeElement;
			if (active !== document.body && !scope?.contains(active)) {
				return;
			}
			restoreFrame.current = requestAnimationFrame(() => {
				const active = document.activeElement;
				if (active !== document.body && !active?.closest("[inert]")) {
					return;
				}
				const target = options.restoreFocusRef?.current;
				if (target?.isConnected && !target.closest("[inert]")) {
					target.focus({preventScroll: true});
				} else if (
					options.opener?.isConnected &&
					options.opener.closest("[inert]")
				) {
					options.fallbackFocus?.();
				}
			});
		};
	}, [options]);
}
