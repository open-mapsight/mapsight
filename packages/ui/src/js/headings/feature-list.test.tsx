import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {cleanup, render, screen} from "@testing-library/react";
import {afterEach, expect, it, vi} from "vitest";

import {
	FeatureListContextProvider,
	type FeatureListContextValue,
} from "../components/feature-list/context";
import FeatureListGroupedContent from "../components/feature-list/grouped-content";
import type {MapsightUiFeature} from "../types";
import {Heading, HeadingsProvider} from "./index";

vi.mock("../components/feature-list-item", () => ({
	default: ({feature}: {feature: MapsightUiFeature}) => (
		<li>
			<Heading>{feature.properties.name}</Heading>
		</li>
	),
}));

afterEach(cleanup);

const features = [
	{
		id: "a",
		type: "Feature",
		geometry: {type: "Point", coordinates: [0, 0]},
		properties: {name: "Place", group: "Places"},
	},
] as MapsightUiFeature[];
const store = configureStore({reducer: () => ({featureSources: {}})});
const value = {
	state: {
		filteredFeatures: features,
		featureSourceId: "places",
		featureSource: {data: {type: "FeatureCollection", features}},
	},
	listUiOptions: {renderAs: "ul"},
	enableKeyboardControl: false,
	itemProps: {},
} as unknown as FeatureListContextValue;

it.each([
	{groupAs: "auto", enabled: true, groupLevel: 4, itemLevel: 5},
	{groupAs: "auto", enabled: false, groupLevel: 3, itemLevel: 2},
	{groupAs: "h3", enabled: true, groupLevel: 3, itemLevel: 4},
	{groupAs: "div", enabled: true, groupLevel: null, itemLevel: 4},
	{groupAs: null, enabled: true, groupLevel: null, itemLevel: 4},
])(
	"preserves grouping and explicit elements: %j",
	({groupAs, enabled, groupLevel, itemLevel}) => {
		render(
			<Provider store={store}>
				<HeadingsProvider enabled={enabled} options={{baseLevel: 4}}>
					<FeatureListContextProvider value={value}>
						<FeatureListGroupedContent groupAs={groupAs} />
					</FeatureListContextProvider>
				</HeadingsProvider>
			</Provider>,
		);
		if (groupLevel === null)
			expect(screen.queryByRole("heading", {name: "Places"})).toBeNull();
		else
			expect(
				screen.getByRole("heading", {
					name: "Places",
					level: groupLevel,
				}),
			).toBeTruthy();
		expect(
			screen.getByRole("heading", {name: "Place", level: itemLevel}),
		).toBeTruthy();
		expect(screen.getAllByRole("listitem")).toHaveLength(1);
	},
);
