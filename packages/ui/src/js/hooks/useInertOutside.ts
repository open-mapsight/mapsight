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

		const targets = collectInertTargets(container);
		applyInert(targets);

		return () => {
			restoreInert(targets);
		};
	}, [containerRef, enabled]);
}
