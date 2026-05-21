// FIXME: use es once default export is fixed in @mapsight/lib-redux
import type {AnyAction, StoreEnhancer} from "@reduxjs/toolkit";
import {applyMiddleware} from "@reduxjs/toolkit";

import {isNonNullable} from "@mapsight/lib-js/nonNullable";
import flattenActions from "@mapsight/lib-redux/flatten-actions";

type Result = {
	handler: null | ((action: AnyAction) => void);
	enhancer: StoreEnhancer<{dispatch: unknown}>;
};

// TODO: This is a candidate for lib-redux
export default function createActionWatcher(): Result {
	const context: Partial<Result> = {
		handler: null,
	};

	context.enhancer = applyMiddleware(
		(_store) => (nextMiddleware) => (action: AnyAction) => {
			const result = nextMiddleware(action);

			if (isNonNullable(context.handler)) {
				const {handler} = context;
				flattenActions(action).map((singleAction) =>
					handler(singleAction),
				);
			}

			return result;
		},
	);

	return context as Result;
}
