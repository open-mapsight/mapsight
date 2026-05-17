import {useEffect, useMemo, useRef} from "react";

export default function useCallbackRef<
	T extends (...args: unknown[]) => unknown,
>(callback: T | undefined): T {
	const ref = useRef(callback);

	useEffect(() => {
		ref.current = callback;
	});

	// See https://github.com/facebook/react/issues/19240#issuecomment-652945246
	return useMemo(() => ((...args) => ref.current?.(...args)) as T, []);
}
