import type {RefObject} from "react";
import {useEffect} from "react";

import {isEventWithNoModKeys} from "../helpers/events";

export default function useHandleEscapeKeyDown(
	ref: RefObject<HTMLElement>,
	onEscape: () => void,
): void {
	useEffect(() => {
		const elem = ref.current;
		if (elem === null) {
			return;
		}

		const handleEsc = (ev: KeyboardEvent): void => {
			if (isEventWithNoModKeys(ev) && ev.key === "Escape") {
				onEscape();
			}
		};

		elem.addEventListener("keydown", handleEsc);
		return () => {
			elem.removeEventListener("keydown", handleEsc);
		};
	}, [ref.current, onEscape]);
}
