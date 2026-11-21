import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {cleanup, render} from "@testing-library/react";
import {afterEach, describe, expect, it} from "vitest";

import {FutureFlagsContext} from "../../future/context";
import Legend from "./legend";

afterEach(cleanup);

describe("Legend", () => {
	it("keeps rendering legends as HTML with v8_attributionText", () => {
		const store = configureStore({
			reducer: () => ({
				map: {
					layers: {
						streets: {metaData: {legend: "<b>Streets</b>"}},
					},
					visibleLayers: ["streets"],
				},
			}),
		});
		const {container} = render(
			<Provider store={store}>
				<FutureFlagsContext.Provider value={{v8_attributionText: true}}>
					<Legend />
				</FutureFlagsContext.Provider>
			</Provider>,
		);
		expect(container.querySelector("b")?.textContent).toBe("Streets");
	});
});
