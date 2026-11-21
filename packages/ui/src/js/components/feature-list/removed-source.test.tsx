import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {act, cleanup, render, screen} from "@testing-library/react";
import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";

import type {FeatureSourceState} from "@mapsight/core/lib/feature-sources/types";

import {setDocumentLanguage} from "../../helpers/i18n";
import {
	FeatureListContextProvider,
	type FeatureListContextValue,
} from "./context";
import FeatureListGroupedContent from "./grouped-content";

beforeEach(() => {
	vi.useFakeTimers();
	setDocumentLanguage("en");
});
afterEach(() => {
	cleanup();
	vi.useRealTimers();
	setDocumentLanguage("de");
});

const emptyCollection = {type: "FeatureCollection", features: []} as const;
const base = {lastUpdate: null, lastActionType: null};

const loaded = (): FeatureSourceState => ({
	...base,
	type: "xhr-json",
	url: "/data.geojson",
	data: emptyCollection,
});
const loading = (): FeatureSourceState => ({
	...base,
	type: "xhr-json",
	url: "/data.geojson",
	data: null,
	isLoading: true,
});
const combined = (featureSourceNames: string[]): FeatureSourceState => ({
	...base,
	type: "combined",
	featureSourceNames,
	data: emptyCollection,
});

/** Renders the list bound to `featureSource` while the store holds `sources`. */
function renderList(
	featureSourceId: string,
	featureSource: FeatureSourceState | undefined,
	sources: Record<string, FeatureSourceState>,
) {
	const store = configureStore({
		reducer: () => ({featureSources: sources}),
	});
	const value = {
		state: {filteredFeatures: [], featureSourceId, featureSource},
		listUiOptions: {renderAs: "ul"},
		enableKeyboardControl: false,
		itemProps: {},
	} as unknown as FeatureListContextValue;
	render(
		<Provider store={store}>
			<FeatureListContextProvider value={value}>
				<FeatureListGroupedContent />
			</FeatureListContextProvider>
		</Provider>,
	);
	act(() => {
		vi.advanceTimersByTime(500);
	});
	return screen.getByRole("status").textContent;
}

describe("feature list with sources that are not in the state", () => {
	it("shows the loading state while a source is loading (control)", () => {
		expect(renderList("pois", loading(), {pois: loading()})).toBe(
			"Loading list…",
		);
	});

	it("is empty, not loading, for a list bound to a removed source", () => {
		expect(renderList("pois", undefined, {})).toBe("no entries in list");
	});

	it("shows the loading state for a combined list with a member that is loading (control)", () => {
		const sources = {parks: loaded(), cafes: loading()};

		expect(renderList("all", combined(["parks", "cafes"]), sources)).toBe(
			"Loading list…",
		);
	});

	it("is empty when one member of a combined list was removed", () => {
		const sources = {parks: loaded()};

		expect(renderList("all", combined(["parks", "cafes"]), sources)).toBe(
			"no entries in list",
		);
	});

	it("is empty when the last member of a combined list was removed", () => {
		expect(renderList("all", combined(["parks"]), {})).toBe(
			"no entries in list",
		);
	});
});
