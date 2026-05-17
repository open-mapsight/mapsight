import type {ForwardedRef, RefObject} from "react";

export function forwardRefValue<T>(
	source: RefObject<T>,
	dest: ForwardedRef<T>,
): void {
	if (dest !== null) {
		if (typeof dest === "function") {
			dest(source.current);
		} else {
			dest.current = source.current;
		}
	}
}
