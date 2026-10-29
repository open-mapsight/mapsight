import {applyStyle} from "ol-mapbox-style";
import {beforeEach, describe, expect, it, vi} from "vitest";

import LazyMapboxVectorLayer from "./LazyMapboxVectorLayer";

vi.mock("ol-mapbox-style", () => ({
	applyStyle: vi.fn().mockResolvedValue(undefined),
	applyBackground: vi.fn().mockResolvedValue(undefined),
}));

describe("LazyMapboxVectorLayer webfonts", () => {
	beforeEach(() => vi.clearAllMocks());

	it("passes the font template when a hidden layer is first shown", () => {
		const layer = new LazyMapboxVectorLayer({
			styleUrl: "/map-assets/styles/base.json",
			visible: false,
			background: false,
			webfonts: "/map-assets/fonts/{font-family}/{fontweight}.css",
		});
		expect(applyStyle).not.toHaveBeenCalled();
		layer.setVisible(true);
		expect(applyStyle).toHaveBeenCalledWith(
			layer,
			"/map-assets/styles/base.json",
			undefined,
			{
				accessToken: undefined,
				webfonts: "/map-assets/fonts/{font-family}/{fontweight}.css",
			},
		);
		layer.setVisible(false);
		layer.setVisible(true);
		expect(applyStyle).toHaveBeenCalledTimes(1);
	});
});
