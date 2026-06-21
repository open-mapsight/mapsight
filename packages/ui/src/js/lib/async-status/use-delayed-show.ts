import {useEffect, useState} from "react";

import {DEFAULT_ASYNC_STATUS_OPTIONS} from "./types";

export function useDelayedShow(
	active: boolean,
	options?: {delayMs?: number; minVisibleMs?: number},
): boolean {
	const delayMs = options?.delayMs ?? DEFAULT_ASYNC_STATUS_OPTIONS.delayMs;
	const minVisibleMs =
		options?.minVisibleMs ?? DEFAULT_ASYNC_STATUS_OPTIONS.minVisibleMs;
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (active) {
			const showTimer = setTimeout(() => {
				setVisible(true);
			}, delayMs);
			return () => {
				clearTimeout(showTimer);
			};
		}

		if (!visible) {
			return;
		}

		const hideTimer = setTimeout(() => {
			setVisible(false);
		}, minVisibleMs);
		return () => {
			clearTimeout(hideTimer);
		};
	}, [active, delayMs, minVisibleMs, visible]);

	if (!active && !visible) {
		return false;
	}

	return visible;
}
