import type {AnyAction, Dispatch, Store} from "@reduxjs/toolkit";

type CompareFunction = (a: unknown, b: unknown) => boolean;

const strictEqualCompare: CompareFunction = (a, b) => a === b;

type UncontrolledActionListener<State = unknown> = (
	previousState: State,
	state: State,
) => void;
type SubscribeUncontrolled<State = unknown> = (
	listener: UncontrolledActionListener<State>,
) => () => void;

export type ObserveHandler<State = unknown, Value = unknown> = (
	newValue?: Value,
	previousValue?: Value,
	state?: State,
) => void;

export type ObserveUncontrolled<State = unknown, Value = unknown> = (
	selector: (state: State) => Value,
	onChange: ObserveHandler<State, Value>,
	compare?: CompareFunction,
) => () => void;

export type StoreExtControlledActions<TState = unknown> = {
	subscribeUncontrolled: SubscribeUncontrolled<TState>;
	observeUncontrolled: ObserveUncontrolled<TState>;
};

export type StoreWithControlledActions<
	S extends Store = Store,
	TState = unknown,
> = S & StoreExtControlledActions<TState>;

function isActionWithMeta(
	action: AnyAction,
): action is AnyAction & {meta: Record<string, unknown>} {
	return "meta" in action;
}

function isControlledAction(
	action: AnyAction,
	controlledActionFlag: string,
): boolean {
	return (
		isActionWithMeta(action) && action.meta?.[controlledActionFlag] === true
	);
}

/**
 * Enhances the store. Allows actions to be flagged as controlled and adds a new function
 * store.observeUncontrolled(selector, onChange, compare) to the store.
 *
 * @param {object} store redux store
 * @param {string|symbol} controlledActionFlag flag that controlled actions expose (action[controlledActionFlag] == true)
 */
export default function enableControlledDispatchAndObserve<State = unknown>(
	store: Store<State>,
	controlledActionFlag = "isControlled",
) {
	let listeners: Array<UncontrolledActionListener<State>> = [];

	function removeListener(listener: UncontrolledActionListener<State>) {
		listeners = listeners.filter((l) => l !== listener);
	}

	function addListener(listener: UncontrolledActionListener<State>) {
		listeners.push(listener);
	}

	const subscribeUncontrolled: SubscribeUncontrolled<State> = (listener) => {
		addListener(listener);

		return function removeListenerBound() {
			removeListener(listener);
		};
	};

	const observeUncontrolled: ObserveUncontrolled<State> = (
		selector,
		onChange,
		compare = strictEqualCompare,
	) =>
		subscribeUncontrolled(
			function handleUncontrolledChange(previousState, state) {
				const previousValue = selector(previousState);
				const newValue = selector(state);

				if (!compare(previousValue, newValue)) {
					onChange(newValue, previousValue, state);
				}
			},
		);

	let wasControlled = false;
	const baseDispatch = store.dispatch;

	const enhancedDispatch: Dispatch = (action) => {
		wasControlled = isControlledAction(action, controlledActionFlag);
		return baseDispatch(action);
	};

	let previousState = store.getState();

	function listenForUncontrolledActions() {
		const state = store.getState();

		if (!wasControlled) {
			listeners.forEach(
				function callUncontrolledChangeListener(listener) {
					listener(previousState, state);
				},
			);
		}

		previousState = state;
	}

	store.subscribe(listenForUncontrolledActions);

	Object.assign(store, {
		dispatch: enhancedDispatch,
		subscribeUncontrolled: subscribeUncontrolled,
		observeUncontrolled: observeUncontrolled,
	});
}
