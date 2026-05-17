import {useEffect, useState} from "react";

// https://usehooks.com/useDebounce/
/**
 * @param value value to debounce
 * @param delay debounce delay
 * @returns debounced value
 */
export default function useDebounce<T>(value: T, delay: number): T {
	// State and setters for debounced value
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(
		() => {
			// Update debounced value after delay
			const handler = setTimeout(() => {
				setDebouncedValue(value);
			}, delay);

			// Cancel the timeout if value changes (also on delay change or unmount)
			// This is how we prevent debounced value from updating if value is changed ...
			// .. within the delay period. Timeout gets cleared and restarted.
			return () => {
				clearTimeout(handler);
			};
		},
		// Only re-call effect if value or delay changes
		[value, delay],
	);

	return debouncedValue;
}
