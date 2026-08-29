import {cleanup, render, screen} from "@testing-library/react";
import {afterEach, describe, expect, it} from "vitest";

import {ComponentsContext} from "../../helpers/components";
import type {MapsightUiFeature} from "../../types";
import FeatureDetailsContentInner from "./feature-details-content-inner";

afterEach(cleanup);

function museum(): MapsightUiFeature {
	return {
		type: "Feature",
		id: "museum-1",
		geometry: {type: "Point", coordinates: [10.5, 52.2]},
		properties: {
			id: "museum-1",
			name: "Museum",
			description: "<p>Beschreibung</p>",
		},
	} as MapsightUiFeature;
}

describe("FeatureDetailsContentInner place-actions slot", () => {
	it("renders FeaturePlaceActions from context when set", () => {
		function Actions({feature}: {feature: MapsightUiFeature}) {
			return <div>actions for {String(feature.id)}</div>;
		}

		render(
			<ComponentsContext.Provider value={{FeaturePlaceActions: Actions}}>
				<FeatureDetailsContentInner
					feature={museum()}
					hasError={false}
				/>
			</ComponentsContext.Provider>,
		);

		expect(screen.getByText("actions for museum-1")).toBeTruthy();
		expect(screen.getByText("Beschreibung")).toBeTruthy();
	});

	it("hides actions when the slot is passed null", () => {
		function Actions() {
			return <div>actions</div>;
		}

		render(
			<ComponentsContext.Provider value={{FeaturePlaceActions: Actions}}>
				<FeatureDetailsContentInner
					feature={museum()}
					hasError={false}
					actions={null}
				/>
			</ComponentsContext.Provider>,
		);

		expect(screen.queryByText("actions")).toBeNull();
		expect(screen.getByText("Beschreibung")).toBeTruthy();
	});
});
