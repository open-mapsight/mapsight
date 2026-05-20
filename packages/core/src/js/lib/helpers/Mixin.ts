import type {Selector} from "@reduxjs/toolkit";

import {mergeAll} from "@/lib/base/actions";
import type {EnhancedStore} from "@/types";

let currentUid = 0;
const getNextUid = () => currentUid++;

type MixinOptions = {
	controllers?: Record<string, string>;
};

export default class Mixin<TOptions = null> {
	protected options: MixinOptions & Partial<TOptions>;

	public readonly name: string;
	public store: EnhancedStore;
	public actions: Record<string, CallableFunction>;
	public controllers: Record<string, string>;
	public selectors: Record<string, Selector>;
	public ids: Record<string, string> = {};

	constructor(
		store: EnhancedStore,
		name = "mapsightMixin-" + getNextUid(),
		options: MixinOptions & Partial<TOptions> = {},
	) {
		this.store = store;
		this.name = name;
		this.options = options;
		this.controllers = Object.assign(
			{},
			this.getDefaultControllerNames(),
			this.options.controllers || {},
		);

		this.beforeInitialization();
		this.actions = this.bindActions();
		this.selectors = this.bindSelectors();

		this.store.dispatch(mergeAll(this.getInitialState()));
		this.afterInitialization();
	}

	createId(id: string) {
		return `${this.name}_${id}`;
	}

	beforeInitialization() {
		//
	}

	afterInitialization() {
		//
	}

	getInitialState() {
		return {};
	}

	getDefaultControllerNames() {
		return {};
	}

	bindActions() {
		return {};
	}

	bindSelectors(): Record<string, Selector> {
		return {};
	}
}
