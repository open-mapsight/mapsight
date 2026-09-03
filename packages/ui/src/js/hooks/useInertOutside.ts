import type {RefObject} from "react";
import {useEffect} from "react";

import {
	applyInert,
	collectInertTargets,
	restoreInert,
} from "../helpers/inert-outside";

/**
 * Sets `inert` on document siblings outside `containerRef` while `enabled`.
 * Restores only the nodes this hook marked, so pre-existing `inert` is kept.
 *
 * Nodes added to the host page while the overlay stays open (late cookie
 * banners, SPA navigation) are inerted as well via a child-list observer.
 */
export default function useInertOutside(
	containerRef: RefObject<HTMLElement | null>,
	enabled: boolean,
): void {
	useEffect(() => {
		if (!enabled || typeof document === "undefined") {
			return;
		}

		const container = containerRef.current;
		if (!container) {
			return;
		}

		// Only nodes marked here are restored, so host-owned `inert` survives.
		const marked = new Set<HTMLElement>();

		const inertNewTargets = () => {
			// collectInertTargets skips nodes that already carry `inert`.
			const targets = collectInertTargets(container);
			applyInert(targets);
			for (const target of targets) {
				marked.add(target);
			}
		};

		inertNewTargets();

		const observer =
			typeof MutationObserver === "undefined"
				? undefined
				: new MutationObserver(inertNewTargets);
		observer?.observe(document.body, {childList: true, subtree: true});

		return () => {
			observer?.disconnect();
			restoreInert(Array.from(marked));
		};
	}, [containerRef, enabled]);
}
