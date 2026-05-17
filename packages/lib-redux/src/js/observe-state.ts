import {Store} from "redux";

function strictEqualCompare<T>(a: T, b: T): boolean {
	return a === b;
}

//const jsonCompare = (a, b)  => JSON.stringify(a) !== JSON.stringify(b);

export const AbortObserving = Symbol(); // TODO: Use Symbol()

function internalObserveState<State = unknown, Value = unknown>(
	store: Store<State>,
	selector: (state: State) => Value,
	listener: (
		newValue: Value,
		oldValue: Value | null,
		state: State,
	) => void | typeof AbortObserving,
	compare = strictEqualCompare,
	initialValue: Value | null = null,
) {
	let currentValue = initialValue;
	const unsubscribe = store.subscribe(function onStateChange() {
		const state = store.getState();
		const newValue = selector(state);

		if (!compare(currentValue, newValue)) {
			const oldValue = currentValue;
			currentValue = newValue;

			const returnValue = listener(newValue, oldValue, state);
			if (returnValue === AbortObserving) {
				unsubscribe();
			}
		}
	});

	return unsubscribe;
}

export function observeState<State = unknown, Value = unknown>(
	store: Store<State>,
	selector: (state: State) => Value,
	listener: (
		newValue: Value,
		oldValue: Value | null,
		state: State,
	) => void | typeof AbortObserving,
	compare = strictEqualCompare,
) {
	const initialValue = selector(store.getState());
	return internalObserveState(
		store,
		selector,
		listener,
		compare,
		initialValue,
	);
}

export function observeStateOnce<State = unknown, Value = unknown>(
	store: Store,
	selector: (state: State) => Value,
	listener: (
		newValue: Value,
		oldValue: Value | null,
		state: State,
	) => void | typeof AbortObserving,
	compare = strictEqualCompare,
) {
	const unsubscribe = observeState(
		store,
		selector,
		function handleChange(newValue, oldValue, state: State) {
			listener(newValue, oldValue, state);
			unsubscribe();
		},
		compare,
	);

	return unsubscribe;
}

export function getAndObserveState<State = unknown, Value = unknown>(
	store: Store<State>,
	selector: (state: State) => Value,
	listener: (
		newValue: Value,
		oldValue: Value | null,
		state: State,
	) => void | typeof AbortObserving,
	compare = strictEqualCompare,
) {
	const initialState = store.getState();
	const initialValue = selector(initialState);

	const initialReturnValue = listener(initialValue, null, initialState);
	if (initialReturnValue === AbortObserving) {
		return () => undefined;
	}

	return internalObserveState(
		store,
		selector,
		listener,
		compare,
		initialValue,
	);
}
