import {describe, expect, it} from "vitest";

import {wms} from "../map/layers";

describe("wms", () => {
	it("defaults the WMS source projection to EPSG:3857", () => {
		const layer = wms("https://example.test/wms");

		expect(layer.type).toBe("TileLayer");
		expect(layer.options.source.type).toBe("TileWMSSource");
		expect(layer.options.source.options.projection).toBe("EPSG:3857");
	});

	it("keeps an explicitly passed projection", () => {
		const layer = wms("https://example.test/wms", {}, "EPSG:25832");

		expect(layer.options.source.type).toBe("TileWMSSource");
		expect(layer.options.source.options.projection).toBe("EPSG:25832");
	});
});
