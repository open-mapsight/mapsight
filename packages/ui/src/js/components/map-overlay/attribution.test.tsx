import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {cleanup, render} from "@testing-library/react";
import {afterEach, describe, expect, it} from "vitest";

import {FutureFlagsContext} from "../../future/context";
import type {FutureFlags} from "../../types";
import Attribution from "./attribution";

afterEach(cleanup);

function renderAttribution(future: FutureFlags) {
	const store = configureStore({
		reducer: () => ({
			map: {
				layers: {
					plain: {
						metaData: {attribution: "<img src=x onerror=alert(1)>"},
					},
					rich: {
						metaData: {
							attribution: "Rich",
							dangerouslySetAttributionHtml: "<b>Rich</b>",
						},
					},
					hidden: {metaData: {attribution: "Hidden"}},
				},
				visibleLayers: ["plain", "rich"],
			},
		}),
	});
	return render(
		<Provider store={store}>
			<FutureFlagsContext.Provider value={future}>
				<Attribution />
			</FutureFlagsContext.Provider>
		</Provider>,
	);
}

describe("Attribution", () => {
	it("reads visible layers from the store and keeps HTML by default", () => {
		const {container} = renderAttribution({});
		const entries = container.querySelectorAll(".ms3-attribution__entry");
		expect(entries).toHaveLength(2);
		expect(entries[0]?.querySelector("img")).not.toBeNull();
		expect(entries[1]?.querySelector("b")?.textContent).toBe("Rich");
	});

	it("renders layer attribution as text with v8_attributionText", () => {
		const {container} = renderAttribution({v8_attributionText: true});
		const entries = container.querySelectorAll(".ms3-attribution__entry");
		expect(entries).toHaveLength(2);
		expect(entries[0]?.textContent).toBe("<img src=x onerror=alert(1)>");
		expect(container.querySelector("img")).toBeNull();
		expect(entries[1]?.querySelector("b")?.textContent).toBe("Rich");
	});
});
