import type {RefObject} from "react";
import {useEffect, useState} from "react";

import {isNestedPlatformModalOpen} from "../helpers/nested-platform-modal";

/**
 * True while a native `<dialog>` or react-modal overlay is open (not `excludeRef`).
 * Used to pause the overlay-chrome focus trap.
 */
export default function useNestedPlatformModal(
	excludeRef?: RefObject<Element | null>,
): boolean {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (typeof document === "undefined") {
			return;
		}

		const sync = () => {
			setOpen(isNestedPlatformModalOpen(excludeRef?.current ?? null));
		};

		sync();

		const observer = new MutationObserver(sync);
		observer.observe(document.body, {
			subtree: true,
			childList: true,
			attributes: true,
			attributeFilter: ["open", "class"],
		});

		return () => observer.disconnect();
	}, [excludeRef]);

	return open;
}
