import {DETAILS_CONTENT_STATE_KEY} from "../config/constants/app";

export type SanitizeRehydratedStateResult = {
	state: unknown;
	resumeFeatureSourceIds: string[];
};

/**
 * In-flight SSR work does not exist after hydrate. Clear loading flags so the
 * client can start those fetches again instead of waiting forever.
 */
export function sanitizeRehydratedState(
	state: unknown,
): SanitizeRehydratedStateResult {
	if (state === null || typeof state !== "object") {
		return {state, resumeFeatureSourceIds: []};
	}

	const next = structuredClone(state) as Record<string, unknown>;
	const resumeFeatureSourceIds = clearFeatureSourceLoading(next);
	clearInFlightAppFetches(next.app);
	return {state: next, resumeFeatureSourceIds};
}

function clearFeatureSourceLoading(state: Record<string, unknown>): string[] {
	const sources = state.featureSources;
	if (sources === null || typeof sources !== "object") {
		return [];
	}

	const resumeFeatureSourceIds: string[] = [];
	for (const [id, raw] of Object.entries(sources)) {
		if (raw === null || typeof raw !== "object") {
			continue;
		}
		const source = raw as Record<string, unknown>;
		if (source.isLoading !== true) {
			continue;
		}
		source.isLoading = false;
		if (shouldResumeFeatureSource(source)) {
			resumeFeatureSourceIds.push(id);
		}
	}

	return resumeIdsMembersFirst(resumeFeatureSourceIds, sources);
}

function shouldResumeFeatureSource(source: Record<string, unknown>): boolean {
	if (source.data != null) {
		return false;
	}
	if (source.error !== undefined && source.error !== null) {
		return false;
	}
	if (source.type === "xhr-json" || source.type === "combined") {
		return true;
	}
	return typeof source.url === "string" && source.url !== "";
}

function resumeIdsMembersFirst(ids: string[], sources: object): string[] {
	const typeOf = (id: string) => {
		const source = (sources as Record<string, {type?: unknown}>)[id];
		return source?.type;
	};
	return [
		...ids.filter((id) => typeOf(id) !== "combined"),
		...ids.filter((id) => typeOf(id) === "combined"),
	];
}

function clearInFlightAppFetches(app: unknown): void {
	if (app === null || typeof app !== "object") {
		return;
	}
	const nextApp = app as Record<string, unknown>;
	resetLoadingFetchSlot(nextApp, DETAILS_CONTENT_STATE_KEY);
	resetLoadingFetchSlot(nextApp, "searchResult");
}

function resetLoadingFetchSlot(
	app: Record<string, unknown>,
	key: string,
): void {
	const slot = app[key];
	if (slot === null || typeof slot !== "object") {
		return;
	}
	const fetchSlot = slot as Record<string, unknown>;
	if (fetchSlot.status !== "loading" && fetchSlot.isLoading !== true) {
		return;
	}
	app[key] = {
		...fetchSlot,
		status: null,
		isLoading: false,
		url: null,
		data: null,
		error: null,
	};
}
