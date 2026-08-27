import {describe, expect, it} from "vitest";

import {sanitizeRehydratedState} from "./sanitize-rehydrated-state";

describe("sanitizeRehydratedState", () => {
	it("clears in-flight feature sources and lists them for client resume", () => {
		const input = {
			app: {view: "desktop"},
			featureSources: {
				pois: {
					type: "xhr-json",
					url: "/pois.geojson",
					isLoading: true,
					data: null,
				},
				done: {
					type: "xhr-json",
					url: "/done.geojson",
					isLoading: false,
					data: {type: "FeatureCollection", features: []},
				},
			},
		};

		const {state, resumeFeatureSourceIds} = sanitizeRehydratedState(input);
		const sources = (state as typeof input).featureSources;

		expect(sources.pois.isLoading).toBe(false);
		expect(sources.done.isLoading).toBe(false);
		expect(sources.done.data).toEqual({
			type: "FeatureCollection",
			features: [],
		});
		expect(resumeFeatureSourceIds).toEqual(["pois"]);
		expect(input.featureSources.pois.isLoading).toBe(true);
	});

	it("does not resume sources that already have data or an error", () => {
		const {resumeFeatureSourceIds, state} = sanitizeRehydratedState({
			featureSources: {
				refreshing: {
					type: "xhr-json",
					isLoading: true,
					data: {type: "FeatureCollection", features: [{id: "1"}]},
				},
				failed: {
					type: "xhr-json",
					isLoading: true,
					data: null,
					error: "HTTP 500",
				},
			},
		});

		expect(resumeFeatureSourceIds).toEqual([]);
		expect(
			(state as {featureSources: {refreshing: {isLoading: boolean}}})
				.featureSources.refreshing.isLoading,
		).toBe(false);
	});

	it("resumes combined sources after their members", () => {
		const {resumeFeatureSourceIds} = sanitizeRehydratedState({
			featureSources: {
				listCombined: {type: "combined", isLoading: true, data: null},
				a: {type: "xhr-json", url: "/a", isLoading: true, data: null},
			},
		});

		expect(resumeFeatureSourceIds).toEqual(["a", "listCombined"]);
	});

	it("resets in-flight details and search fetches", () => {
		const {state} = sanitizeRehydratedState({
			app: {
				featureItemDetailsContent: {
					url: "/details.html",
					status: "loading",
					data: null,
				},
				searchResult: {
					status: "loading",
					isLoading: true,
					data: null,
				},
			},
		});
		const app = (
			state as {
				app: {
					featureItemDetailsContent: {status: unknown; url: unknown};
					searchResult: {status: unknown; isLoading: unknown};
				};
			}
		).app;

		expect(app.featureItemDetailsContent).toMatchObject({
			status: null,
			url: null,
			data: null,
		});
		expect(app.searchResult).toMatchObject({
			status: null,
			isLoading: false,
		});
	});
});
