import {describe, expect, it, vi} from "vitest";

import {LOAD_FEATURE_SOURCE, load} from "@/lib/feature-sources/actions";
import type {FeatureSourcesState} from "@/lib/feature-sources/types";

const controllerName = "featureSources";

describe("load", () => {
	it("does not retry immediately after a failed load", async () => {
		const dispatch = vi.fn();
		const getState = () =>
			({
				[controllerName]: {
					hotels: {
						type: "xhr-json",
						url: "/missing.geojson",
						isLoading: false,
						error: "Not Found",
						data: null,
						lastUpdate: null,
						lastActionType: null,
					},
				},
			}) as Record<string, FeatureSourcesState>;

		const thunk = load(controllerName, "hotels");
		await thunk(dispatch, getState, undefined);

		expect(dispatch).not.toHaveBeenCalled();
	});

	it("retries a failed load when forceRefresh is set", async () => {
		const dispatch = vi.fn();
		const getState = () =>
			({
				[controllerName]: {
					hotels: {
						type: "xhr-json",
						url: "/missing.geojson",
						isLoading: false,
						error: "Not Found",
						data: null,
						lastUpdate: null,
						lastActionType: null,
						requestId: 1,
					},
				},
			}) as Record<string, FeatureSourcesState>;

		const thunk = load(controllerName, "hotels", {forceRefresh: true});
		await thunk(dispatch, getState, undefined);

		expect(dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				type: LOAD_FEATURE_SOURCE,
				id: "hotels",
			}),
		);
	});
});
