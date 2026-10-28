// @vitest-environment node
import {renderToString} from "react-dom/server";
import {Provider} from "react-redux";

import {configureStore} from "@reduxjs/toolkit";
import {expect, it, vi} from "vitest";

import PointInputControls from "./index";

it("imports and renders without a browser, reads no DOM and does not dispatch", () => {
	expect(typeof window).toBe("undefined");
	expect(typeof document).toBe("undefined");
	const store = Object.assign(configureStore({reducer: () => ({})}), {
		getController: () => ({getMap: () => null}),
	});
	const dispatch = vi.spyOn(store, "dispatch");
	const html = renderToString(
		<Provider store={store}>
			<PointInputControls featureSourceId="pointInput_featureSource" />
		</Provider>,
	);
	expect(html).toContain("Kartenmitte übernehmen");
	expect(html).toContain("disabled");
	expect(dispatch).not.toHaveBeenCalled();
});
