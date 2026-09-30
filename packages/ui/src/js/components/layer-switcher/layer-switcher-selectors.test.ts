import {describe, expect, it} from "vitest";

import {
	cachedMakeFeatureSourceFromLayerIdSelector,
	cachedMakeFeatureSourceIdFromLayerIdSelector,
	cachedMakeLayerLockedInLayerSwitcherSelector,
	cachedMakeLayerTitleSelector,
	cachedMakeLayerVisibleSelector,
} from "./layer-switcher-selectors";

describe("layer-switcher-selectors", () => {
	it("caches per-layer selectors by id", () => {
		expect(cachedMakeLayerTitleSelector("a")).toBe(
			cachedMakeLayerTitleSelector("a"),
		);
		expect(cachedMakeLayerTitleSelector("a")).not.toBe(
			cachedMakeLayerTitleSelector("b"),
		);

		expect(cachedMakeLayerLockedInLayerSwitcherSelector("a")).toBe(
			cachedMakeLayerLockedInLayerSwitcherSelector("a"),
		);
		expect(cachedMakeLayerVisibleSelector("a")).toBe(
			cachedMakeLayerVisibleSelector("a"),
		);
		expect(cachedMakeFeatureSourceIdFromLayerIdSelector("a")).toBe(
			cachedMakeFeatureSourceIdFromLayerIdSelector("a"),
		);
		expect(cachedMakeFeatureSourceFromLayerIdSelector("a")).toBe(
			cachedMakeFeatureSourceFromLayerIdSelector("a"),
		);
	});

	it("keeps distinct factory caches independent", () => {
		expect(cachedMakeLayerTitleSelector("a")).not.toBe(
			cachedMakeLayerVisibleSelector("a"),
		);
		expect(cachedMakeFeatureSourceIdFromLayerIdSelector("a")).not.toBe(
			cachedMakeFeatureSourceFromLayerIdSelector("a"),
		);
	});
});
