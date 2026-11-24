import {describe, expect, it, vi} from "vitest";

describe("LazyMapboxVectorLayer webfonts", () => {
	it("passes the font template when a hidden layer is first shown", async () => {
		// Other files sharing this worker can cache the real style layer first.
		vi.resetModules();
		const applyStyle = vi.fn().mockResolvedValue(undefined);
		vi.doMock("ol-mapbox-style", () => ({
			applyStyle,
			applyBackground: vi.fn().mockResolvedValue(undefined),
		}));

		try {
			const {default: LazyMapboxVectorLayer} =
				await import("./LazyMapboxVectorLayer");
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
					webfonts:
						"/map-assets/fonts/{font-family}/{fontweight}.css",
				},
			);
			layer.setVisible(false);
			layer.setVisible(true);
			expect(applyStyle).toHaveBeenCalledTimes(1);
		} finally {
			vi.doUnmock("ol-mapbox-style");
			vi.resetModules();
		}
	});
});
