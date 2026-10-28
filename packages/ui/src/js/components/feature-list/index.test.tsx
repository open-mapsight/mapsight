import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {cleanup, fireEvent, render, screen} from "@testing-library/react";
import {afterEach, expect, it, vi} from "vitest";

import {deselectAll} from "@mapsight/core/lib/feature-selections/actions";

import {VIEW_DESKTOP} from "../../config/constants/app";
import {FEATURE_SELECTIONS} from "../../config/constants/controllers";
import {useFeatureListContext} from "./context";
import FeatureList from "./index";

vi.mock("./hooks/useFeatureListFeatureSource", () => ({default: () => ({})}));
vi.mock("./hooks/useFeatureListState", () => ({
	default: () => ({features: [], filteredFeatures: [], featureCount: 0}),
}));
afterEach(cleanup);

function DeselectControl() {
	const {deselectFeature} = useFeatureListContext();
	return <button onClick={deselectFeature}>Deselect</button>;
}

it.each([undefined, "preselect"] as const)(
	"deselects the configured selection group (%s), defaulting to select",
	(selectionBehaviorSelection) => {
		const reducer = vi.fn(
			(
				state = {
					app: {
						view: VIEW_DESKTOP,
						list: {selectionBehaviorSelection},
					},
				},
			) => state,
		);
		const store = configureStore({reducer});
		render(
			<Provider store={store}>
				<FeatureList
					contentAs={DeselectControl}
					headerAs={() => null}
					footerAs={() => null}
					autoloadFeatureSource={false}
				/>
			</Provider>,
		);
		fireEvent.click(screen.getByRole("button", {name: "Deselect"}));
		expect(reducer).toHaveBeenLastCalledWith(
			expect.anything(),
			deselectAll(
				FEATURE_SELECTIONS,
				selectionBehaviorSelection ?? "select",
			),
		);
	},
);
