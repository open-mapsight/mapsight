import Point from "ol/geom/Point.js";

import {describe, expect, it, vi} from "vitest";

import LearnableFeature, {
	DEFAULT_CORE_PROPERTY_KEYS,
	resetLearnableFeatureMissWarningsForTests,
} from "./learnable-feature.ts";

describe("LearnableFeature", () => {
	it("keeps only core keys in the local OpenLayers bag", () => {
		const backing = {
			name: "Parkhaus Eiermarkt",
			markerCaption: "207",
			description: "<section>fat html</section>",
			tagGroups: {place: ["innenstadt"]},
		};
		const feature = new LearnableFeature(
			{geometry: new Point([0, 0]), ...backing},
			{coreKeys: DEFAULT_CORE_PROPERTY_KEYS},
		);

		const local = feature.getProperties();
		expect(local.name).toBe("Parkhaus Eiermarkt");
		expect(local.markerCaption).toBe("207");
		expect(local).not.toHaveProperty("description");
		expect(local).not.toHaveProperty("tagGroups");
		expect(feature.getBacking()).toMatchObject(backing);
		expect(feature.getBacking()).not.toHaveProperty("geometry");
	});

	it("serves backing keys from get() and calls onMiss per access", () => {
		resetLearnableFeatureMissWarningsForTests();
		const onMiss = vi.fn();
		const feature = new LearnableFeature(new Point([1, 2]), {
			backing: {description: "html", name: "Stop"},
			coreKeys: ["name"],
			onMiss,
		});

		expect(feature.get("name")).toBe("Stop");
		expect(onMiss).not.toHaveBeenCalled();
		expect(feature.get("description")).toBe("html");
		expect(feature.get("description")).toBe("html");
		expect(onMiss).toHaveBeenCalledTimes(2);
		expect(onMiss.mock.calls[0]?.[0]).toBe("description");
		expect(feature.getProperties()).not.toHaveProperty("description");
	});

	it("warns once per key with the default miss handler", () => {
		resetLearnableFeatureMissWarningsForTests();
		const warn = vi
			.spyOn(console, "warn")
			.mockImplementation(() => undefined);
		try {
			const feature = new LearnableFeature(new Point([1, 2]), {
				backing: {description: "html"},
				coreKeys: ["name"],
			});

			expect(feature.get("description")).toBe("html");
			expect(feature.get("description")).toBe("html");
			expect(warn).toHaveBeenCalledTimes(1);
		} finally {
			warn.mockRestore();
		}
	});

	it("keeps the GeoJSON properties object as the backing reference", () => {
		const backing = {name: "Stop", description: "html"};
		const feature = new LearnableFeature(new Point([0, 0]), {
			coreKeys: ["name"],
			onMiss: () => undefined,
		});
		feature.setProperties(backing, true);

		expect(feature.getBacking()).toBe(backing);
		expect(feature.get("name")).toBe("Stop");
		expect(feature.getProperties()).not.toHaveProperty("description");
	});

	it("promotes a missed key into the local bag when asked", () => {
		const feature = new LearnableFeature(new Point([0, 0]), {
			backing: {description: "html", mapsightIconId: "parkhaus"},
			coreKeys: ["mapsightIconId"],
			onMiss: () => undefined,
			promoteOnMiss: true,
		});

		expect(feature.get("description")).toBe("html");
		expect(feature.getProperties().description).toBe("html");
		expect(feature.coreKeys.has("description")).toBe(true);
	});

	it("clones local properties and keeps the same backing reference", () => {
		const backing = {name: "A", description: "html"};
		const feature = new LearnableFeature(
			{geometry: new Point([3, 4]), ...backing},
			{backing, coreKeys: ["name"], onMiss: () => undefined},
		);
		feature.setId("stop-1");
		const clone = feature.clone();

		expect(clone).toBeInstanceOf(LearnableFeature);
		expect(clone.getId()).toBe("stop-1");
		expect(clone.get("name")).toBe("A");
		expect(clone.getBacking()).toBe(feature.getBacking());
		expect(clone.getGeometry()).not.toBe(feature.getGeometry());
		expect(clone.get("description")).toBe("html");
	});

	it("drops stale local keys when the backing changes", () => {
		const feature = new LearnableFeature(new Point([0, 0]), {
			backing: {name: "A", markerCaption: "1"},
			coreKeys: ["name", "markerCaption"],
			onMiss: () => undefined,
		});
		expect(feature.get("markerCaption")).toBe("1");

		feature.setBacking({name: "B"});

		expect(feature.get("name")).toBe("B");
		expect(feature.get("markerCaption")).toBeUndefined();
		expect(feature.getProperties()).not.toHaveProperty("markerCaption");
	});
});
