import type {Dispatch, SetStateAction} from "react";
import {useCallback, useEffect, useState} from "react";

import useCallbackRef from "./useCallbackRef";
import usePrevious from "./usePrevious";

const noop = () => {
	// empty
};

export default function useControllableState<T>({
	prop,
	defaultProp,
	onChange = noop,
}: {
	prop?: T | undefined;
	defaultProp?: T | undefined;
	onChange?: (state: T) => void;
}) {
	const [state, setState] = useState<T | undefined>(defaultProp);
	const handleChange = useCallbackRef(onChange);

	const prevState = usePrevious(state);
	useEffect(() => {
		if (prevState !== state) {
			handleChange(state as T);
		}
	}, [state, prevState, handleChange]);

	const isControlled = prop !== undefined;
	const value = isControlled ? prop : state;

	const setValue: Dispatch<SetStateAction<T | undefined>> = useCallback(
		(nextValue) => {
			if (isControlled) {
				const controlledValue =
					typeof nextValue === "function"
						? (nextValue as (prevState?: T) => T)(prop)
						: nextValue;
				if (controlledValue !== prop)
					handleChange(controlledValue as T);
			} else {
				setState(nextValue);
			}
		},
		[isControlled, prop, setState, handleChange],
	);

	return [value, setValue] as const;
}
