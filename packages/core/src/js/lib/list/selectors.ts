import {createFilteredFeatureSourceSelector} from "@/lib/feature-sources/selectors";
import type {FeatureSourceState} from "@/lib/feature-sources/types";
import type {ListState} from "@/lib/list/types";
import type {Selector, State} from "@/types";

export const featureSourceIdSelector = (state?: ListState) =>
	state?.featureSource;

export function createListFeatureSelector(
	listControllerName: string,
	featureSourcesControllerName: string,
) {
	// default which is needed if there's no list source set at first call to this
	// then selector is undefined and keeps undefined as featureSourceId and
	// currentFeatureSourceId are undefined too und updateFeatureSelector does not get called
	let selector: Selector<FeatureSourceState | undefined> = (_) => undefined;
	let currentFeatureSourceId: string;

	function updateFeatureSelector() {
		selector = createFilteredFeatureSourceSelector(
			featureSourcesControllerName,
			currentFeatureSourceId,
			listControllerName,
		);
	}

	return function listFeatureSelector(state: State) {
		const listState = state[listControllerName] as ListState | undefined;
		const featureSourceId = featureSourceIdSelector(listState);
		if (featureSourceId && featureSourceId !== currentFeatureSourceId) {
			currentFeatureSourceId = featureSourceId;
			updateFeatureSelector();
		}

		return selector(state);
	};
}
