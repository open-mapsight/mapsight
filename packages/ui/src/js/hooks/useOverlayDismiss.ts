import type {RefObject} from "react";
import {useEffect} from "react";

type UseOverlayDismissOptions = {
	isActive: boolean;
	onDismiss: () => void;
	excludeRefs: Array<RefObject<Element | null>>;
};

/** Closes an overlay on outside pointer down or Escape without using focus-trap `onDeactivate`. */
export default function useOverlayDismiss({
	isActive,
	onDismiss,
	excludeRefs,
}: UseOverlayDismissOptions) {
	useEffect(() => {
		if (!isActive) {
			return;
		}

		const isInsideExcluded = (target: EventTarget | null) => {
			if (!(target instanceof Node)) {
				return false;
			}

			return excludeRefs.some((ref) => ref.current?.contains(target));
		};

		const onPointerDown = (event: PointerEvent) => {
			if (isInsideExcluded(event.target)) {
				return;
			}

			onDismiss();
		};

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onDismiss();
			}
		};

		document.addEventListener("pointerdown", onPointerDown, true);
		document.addEventListener("keydown", onKeyDown);

		return () => {
			document.removeEventListener("pointerdown", onPointerDown, true);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [excludeRefs, isActive, onDismiss]);
}
