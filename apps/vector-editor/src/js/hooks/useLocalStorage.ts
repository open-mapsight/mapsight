import {useState} from "react";

/*
 * Sync state to local storage so that it persists through a page refresh. Usage is similar to useState except we pass in a
 * local storage key so that we can default to that value on page load instead of the specified initial value.
 */
function useLocalStorage<T = unknown>(
	key: string,
	initialValue: T,
): [T, (value: T | ((val: T) => T)) => void] {
	// FIXME: key changes are ignored

	// State to store our value
	// Pass initial state function to useState so logic is only executed once
	const [storedValue, setStoredValue] = useState(() => {
		try {
			// Get from local storage by key
			// eslint-disable-next-line n/no-unsupported-features/node-builtins
			const item = window.localStorage.getItem(key);
			// Parse stored json or if none return initialValue
			return item ? (JSON.parse(item) as T) : initialValue;
		} catch (error) {
			// If error also return initialValue
			console.log(error);
			return initialValue;
		}
	});

	// Return a wrapped version of useState's setter function that ...
	// ... persists the new value to localStorage.
	// TODO: use useCallback?
	const setValue = (value: T | ((val: T) => T)) => {
		try {
			// Allow value to be a function, so we have same API as useState
			const valueToStore: T =
				value instanceof Function ? value(storedValue) : value;
			// Save state
			setStoredValue(valueToStore);
			// Save to local storage
			// eslint-disable-next-line n/no-unsupported-features/node-builtins
			window.localStorage.setItem(key, JSON.stringify(valueToStore));
		} catch (error) {
			// A more advanced implementation would handle the error case
			console.log(error);
		}
	};

	return [storedValue, setValue];
}

export default useLocalStorage;
