import type {Store as ReduxStore} from "@reduxjs/toolkit";

import {ERROR} from "@/lib/feature-sources/selectors";
import type {
	FeatureSourceData,
	FeatureSourceState,
} from "@/lib/feature-sources/types";

export const defaultSelector = (state: FeatureSourceState) => ({
	error: null,
	data: state,
});
export const defaultTransformer = (state: unknown): FeatureSourceData =>
	state as FeatureSourceData;

type Selector = (state: unknown) => {error: unknown; data: unknown};
type Transformer = (state: unknown) => FeatureSourceData;

export type LocalStateLoaderState = {
	store?: ReduxStore;
	selector?: Selector;
	transformer?: Transformer;
};

export type LocalStateLoaderOptions = {
	selector?: Selector;
};

type GetState = () => unknown;

export async function load(
	state: LocalStateLoaderState,
	options: LocalStateLoaderOptions,
	id: string,
	getState: GetState,
): Promise<FeatureSourceData | undefined> {
	const selector = state.selector || defaultSelector;
	const sourceState = selector(
		state.store ? state.store.getState() : getState(),
	);
	const transformer = state.transformer || defaultTransformer;

	if (sourceState && sourceState.data) {
		return transformer(sourceState.data);
	}

	await Promise.resolve();
	await Promise.reject((sourceState && sourceState.error) || ERROR);
	return;
}
