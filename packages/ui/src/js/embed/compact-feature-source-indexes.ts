function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Prepare the default featureSources slice for wire serialization. Core restores
 * these derived indexes from data during store creation, before serverState is
 * captured. Keep every collection (including combined and edited data) intact.
 *
 * The returned shallow copy is for dehydration only, never for a live store.
 */
export function compactFeatureSourceIndexes(state: unknown): unknown {
	if (!isRecord(state) || !isRecord(state.featureSources)) {
		return state;
	}

	let sources = state.featureSources;
	for (const [id, source] of Object.entries(state.featureSources)) {
		if (
			!isRecord(source) ||
			(!Object.hasOwn(source, "ids") &&
				!Object.hasOwn(source, "featuresById"))
		) {
			continue;
		}
		if (sources === state.featureSources) sources = {...sources};
		const compact = {...source};
		delete compact.ids;
		delete compact.featuresById;
		sources[id] = compact;
	}

	return sources === state.featureSources
		? state
		: {...state, featureSources: sources};
}
