import unique from "lodash/uniq";

export default function reduceByKeys(
	keys: Array<string>,
	state: Record<string, unknown>,
) {
	if (keys && state) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call
		const uniqueKeys: Array<string> = unique(keys);

		return uniqueKeys.reduce(function reduceByKey(newState, key) {
			return state[key] !== undefined
				? {...newState, [key]: state[key]}
				: newState;
		}, {});
	}

	return state;
}
