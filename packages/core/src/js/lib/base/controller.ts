import type {Observable, Reducer, Store, Unsubscribe} from "@reduxjs/toolkit";
import {compose} from "@reduxjs/toolkit";
import {EventEmitter} from "eventemitter3";

import {baseReducer} from "@/lib/base/reducer";
import type {
	Action,
	ActionOrThunk,
	EnhancedStore,
	ObserveHandler,
	Selector,
	State,
} from "@/types";

export class BaseController<TState extends State = State>
	extends EventEmitter
	implements Store<unknown>
{
	// TODO: Should we also implement: observe, getAndObserve and getAndSubscribe?

	readonly #name: string;
	#store: EnhancedStore<TState> | null = null;
	#selector: Selector<TState> | null = null;
	#reducers: Array<Reducer<TState>>;

	constructor(controllerName: string) {
		super();

		this.#name = controllerName;
		this.#reducers = [];
	}

	replaceReducer(_nextReducer: Reducer<TState>): void {}

	[Symbol.observable](): Observable<unknown> {
		throw new Error("Method not implemented.");
	}

	getName() {
		return this.#name;
	}

	getStore() {
		return this.#store;
	}

	getState(): TState {
		const store: EnhancedStore<TState> | null = this.getStore();
		if (!store) {
			throw new Error("Controller not bound to store");
		}

		if (!this.#selector) {
			throw new Error("Selector not set");
		}

		return this.#selector(store.getState());
	}

	dispatch<T extends ActionOrThunk>(action: T): T {
		const store = this.getStore();
		if (!store) {
			throw new Error("Controller not bound to store");
		}

		return store.dispatch(action) as T;
	}

	/**
	 * Observes the controller's state by the given selector,
	 * calling the given handler if the selected state changes (by means of strict equality)
	 * but ONLY if the action that changed the state was not controlled by the controller.
	 *
	 * @param selector observe selector
	 * @param handler observe handler
	 * @returns unsubscribe function
	 */
	observeUncontrolled<TValue = unknown>(
		selector: Selector<TValue>,
		handler: ObserveHandler<TValue>,
	) {
		const store = this.getStore();
		if (!store) {
			throw new Error("Controller not bound to store");
		}

		const boundHandler = handler.bind(this);
		const composedSelector = this.#selector
			? compose(selector, this.#selector)
			: selector;
		return store.observeUncontrolled(
			composedSelector,
			boundHandler as ObserveHandler,
		);
	}

	/**
	 * Observes the controller's state by the given selector,
	 * calling the given handler if the selected state changes (by means of strict equality)
	 * but ONLY if the action that changed the state was not controlled by the controller.
	 *
	 * Additionally, the handler is called with the initial state.
	 *
	 * @param selector observe selector
	 * @param handler observe handler
	 * @returns unsubscribe function
	 */
	getAndObserveUncontrolled<TValue = unknown>(
		selector: Selector<TValue>,
		handler: ObserveHandler<TValue>,
	) {
		const store = this.getStore();
		if (!store) {
			throw new Error("Controller not bound to store");
		}

		const boundHandler = handler.bind(this);
		const composedSelector = this.#selector
			? compose(selector, this.#selector)
			: selector;
		const unsubscribe = store.observeUncontrolled(
			composedSelector,
			boundHandler as ObserveHandler,
		);
		boundHandler(composedSelector(store.getState()));
		return unsubscribe;
	}

	/**
	 * Observes the controller's state
	 * calling the given handler if the selected state changes (by means of strict equality).
	 *
	 * @param {Function} handler subscribe handler
	 * @returns {Function} unsubscribe function
	 */
	subscribe(handler: ObserveHandler): Unsubscribe {
		const store = this.getStore();
		if (!store) {
			throw new Error("Controller not bound to store");
		}

		return store.subscribe(handler.bind(this));
	}

	/**
	 * Observes the controller's state
	 * calling the given handler if the selected state changes (by means of strict equality)
	 * but ONLY if the action that changed the state was not controlled by the controller.
	 *
	 * @param handler subscribe handler
	 * @returns unsubscribe function
	 */
	subscribeUncontrolled(handler: ObserveHandler) {
		const store = this.getStore();
		if (!store) {
			throw new Error("Controller not bound to store");
		}

		const selector = this.#selector;
		if (!selector) {
			throw new Error("Selector not set");
		}

		return store.observeUncontrolled(selector, handler.bind(this));
	}

	/**
	 * Observes the controller's state
	 * calling the given handler if the selected state changes (by means of strict equality)
	 * but ONLY if the action that changed the state was not controlled by the controller.
	 *
	 * Additionally, the handler is called with the initial state.
	 *
	 * @param handler subscribe handler
	 * @returns unsubscribe function
	 */
	getAndSubscribeUncontrolled(handler: ObserveHandler) {
		const store = this.getStore();
		if (!store) {
			throw new Error("Controller not bound to store");
		}

		const selector = this.#selector;
		if (!selector) {
			throw new Error("Selector not set");
		}

		const boundHandler = handler.bind(this);
		const unsubscribe = store.observeUncontrolled(selector, boundHandler);
		boundHandler(this.getState());
		return unsubscribe;
	}

	/**
	 * This method will be called when the controller is bound by createMapsightStore().
	 *
	 * @param store store to bind to
	 */
	bindToStore(store: EnhancedStore<TState>) {
		if (this.#store) {
			console.error(
				"Controller is already bound to a store. Rebinding is NOT supported!",
			);
			return;
		}

		this.#store = store;
		this.#selector = (state) => state[this.getName()] as TState;
	}

	/**
	 * This method will be called once all controllers are bound to the store.
	 * Use this method to implement controller code that requires access to the store or other controllers!
	 */
	init() {
		// empty
	}

	registerReducer(reducer: Reducer) {
		this.#reducers.push(reducer);
	}

	/**
	 * @param state that part of the state in control of the controller
	 * @param action action to perform on state
	 * @returns modified part of the state in control of the controller after performing action
	 */
	reduce(state: TState = {} as TState, action: Action) {
		this.#reducers.forEach((reducer) => {
			state = reducer(state, action);
		});
		return baseReducer<TState>(state, action);
	}
}
