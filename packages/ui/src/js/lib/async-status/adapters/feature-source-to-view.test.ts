import {describe, expect, it} from "vitest";

import type {FeatureSourceState} from "@mapsight/core/lib/feature-sources/types";

import {featureSourceToView} from "./feature-source-to-view";

const combinedSource = (
	featureSourceNames: string[],
	data: FeatureSourceState["data"] = {
		type: "FeatureCollection",
		features: [],
	},
): FeatureSourceState => ({
	type: "combined",
	featureSourceNames,
	data,
	lastUpdate: null,
	lastActionType: null,
});

const xhrMember = (
	overrides: Partial<FeatureSourceState> = {},
): FeatureSourceState => ({
	type: "xhr-json",
	url: "/data.geojson",
	data: null,
	lastUpdate: null,
	lastActionType: null,
	...overrides,
});

describe("featureSourceToView", () => {
	it("treats combined source with loading members as pending", () => {
		const view = featureSourceToView(combinedSource(["parks", "cafes"]), {
			memberSources: [
				xhrMember({isLoading: true}),
				xhrMember({data: null}),
			],
		});

		expect(view.status).toBe("pending");
		expect(view.fetchStatus).toBe("fetching");
		expect(view.data).toBeUndefined();
	});

	it("treats combined source with unsettled members as pending", () => {
		const view = featureSourceToView(combinedSource(["parks"]), {
			memberSources: [xhrMember()],
		});

		expect(view.status).toBe("pending");
		expect(view.fetchStatus).toBe("fetching");
	});

	it("shows success when combined members finished with empty data", () => {
		const view = featureSourceToView(combinedSource(["parks"]), {
			memberSources: [
				xhrMember({
					data: {type: "FeatureCollection", features: []},
				}),
			],
		});

		expect(view.status).toBe("success");
		expect(view.fetchStatus).toBe("idle");
	});

	it("shows refreshing when combined has data while members still load", () => {
		const view = featureSourceToView(
			combinedSource(["parks", "cafes"], {
				type: "FeatureCollection",
				features: [{id: "1"}],
			}),
			{
				memberSources: [
					xhrMember({
						data: {
							type: "FeatureCollection",
							features: [{id: "1"}],
						},
					}),
					xhrMember({isLoading: true}),
				],
			},
		);

		expect(view.status).toBe("success");
		expect(view.fetchStatus).toBe("fetching");
	});

	it("shows member error when combined list is still empty", () => {
		const view = featureSourceToView(combinedSource(["parks"]), {
			memberSources: [xhrMember({error: "network failure"})],
		});

		expect(view.status).toBe("error");
		expect(view.error).toBe("network failure");
	});
});
