import {describe, expect, it, vi} from "vitest";

import {selectExclusively} from "@mapsight/core/lib/feature-selections/actions";
import {FEATURE_SOURCE_DATA} from "@mapsight/core/lib/feature-sources/actions";

import {FEATURE_SELECTIONS} from "../../config/constants/controllers";
import {FEATURE_SELECTION_SELECT} from "../../config/feature/selections";
import {
	DEFAULT_MARKED_POINT_FEATURE_ID,
	createMarkedPointFeature,
	ensureMarkedPointLayerAction,
	eventPointIsOverMap,
	eventTargetIsInMap,
	eventTargetIsInMapMenu,
	eventTargetIsInteractiveOverlay,
	formatCoordinateSpellings,
	formatLonLat,
	isMapContextMenuKeyboardEvent,
	isMarkedPointFeature,
	markedPointCollection,
	markedPointCoordsHtml,
	markedPointSourceId,
	setMarkedPoint,
	shouldOpenMapContextMenu,
} from "./marked-point";

describe("formatLonLat", () => {
	it("formats lat before lon with five decimals", () => {
		expect(formatLonLat(52.2647, 10.5236)).toBe("52.26470, 10.52360");
	});
});

describe("formatCoordinateSpellings", () => {
	it("lists decimal, hemisphere degrees, and DMS", () => {
		expect(formatCoordinateSpellings(52.2647, 10.5236)).toEqual({
			decimal: "52.26470, 10.52360",
			decimalDegrees: "52.26470° N, 10.52360° E",
			dms: "52° 15′ 52.9″ N, 10° 31′ 25.0″ E",
			text: [
				"52.26470, 10.52360",
				"52.26470° N, 10.52360° E",
				"52° 15′ 52.9″ N, 10° 31′ 25.0″ E",
			].join("\n"),
		});
	});
});

describe("markedPointCoordsHtml", () => {
	it("puts each spelling on its own line", () => {
		const html = markedPointCoordsHtml(52.26, 10.52);
		expect(html).toContain('class="ms3-marked-point-coords"');
		expect(html.match(/ms3-marked-point-coords__line/g)).toHaveLength(3);
		expect(html).toContain("52.26000, 10.52000");
		expect(html).toContain("52.26000° N, 10.52000° E");
		expect(html).not.toContain("38100");
	});
});

describe("isMarkedPointFeature", () => {
	it("recognizes the default id and an explicit marked-point flag", () => {
		expect(isMarkedPointFeature({id: "link-marker", properties: {}})).toBe(
			true,
		);
		expect(
			isMarkedPointFeature({
				id: "host-marker",
				properties: {mapsightMarkedPoint: true},
			}),
		).toBe(true);
		expect(isMarkedPointFeature({id: "schlosspark", properties: {}})).toBe(
			false,
		);
	});
});

describe("createMarkedPointFeature", () => {
	it("builds a WGS84 point with a stable id", () => {
		const feature = createMarkedPointFeature(10.52, 52.26);

		expect(feature.id).toBe(DEFAULT_MARKED_POINT_FEATURE_ID);
		expect(feature.geometry).toEqual({
			type: "Point",
			coordinates: [10.52, 52.26],
		});
		expect(feature.properties?.name).toBe("52.26000, 10.52000");
		expect(feature.properties?.listInformation).toBeUndefined();
		expect(feature.properties?.description).toContain(
			"ms3-marked-point-coords__line",
		);
	});

	it("keeps the address in listInformation and coords in the details HTML", () => {
		const feature = createMarkedPointFeature(10.52, 52.26, {
			name: "Burgplatz 2",
			listInformation: "38100 Braunschweig",
		});

		expect(feature.properties?.listInformation).toBe("38100 Braunschweig");
		expect(feature.properties?.description).toContain("52.26000, 10.52000");
		expect(feature.properties?.description).not.toContain("38100");
	});
});

describe("markedPointCollection", () => {
	it("replaces rather than stacking when written twice", () => {
		const first = markedPointCollection(
			createMarkedPointFeature(10.1, 52.1, {name: "a"}),
		);
		const second = markedPointCollection(
			createMarkedPointFeature(10.2, 52.2, {name: "b"}),
		);

		expect(first.features).toHaveLength(1);
		expect(second.features).toHaveLength(1);
		expect(second.features[0]?.properties?.name).toBe("b");
		expect(second.features[0]?.id).toBe(first.features[0]?.id);
	});
});

describe("setMarkedPoint", () => {
	it("writes one feature and selects that id", () => {
		const dispatched: unknown[] = [];
		const dispatch = vi.fn((action: unknown) => {
			if (typeof action === "function") {
				return action(dispatch);
			}
			dispatched.push(action);
			return action;
		});

		const feature = setMarkedPoint({
			lon: 10.52,
			lat: 52.26,
			featureName: "Pin",
		})(dispatch);

		expect(feature.id).toBe(DEFAULT_MARKED_POINT_FEATURE_ID);
		expect(
			dispatched.some(
				(action) =>
					typeof action === "object" &&
					action !== null &&
					"type" in action &&
					action.type === FEATURE_SOURCE_DATA,
			),
		).toBe(true);
		expect(dispatched).toContainEqual(
			selectExclusively(
				FEATURE_SELECTIONS,
				FEATURE_SELECTION_SELECT,
				DEFAULT_MARKED_POINT_FEATURE_ID,
			),
		);
	});
});

describe("shouldOpenMapContextMenu", () => {
	it("opens when the pointer did not move", () => {
		expect(shouldOpenMapContextMenu({x: 10, y: 20}, {x: 10, y: 20})).toBe(
			true,
		);
	});

	it("ignores a drag past the threshold", () => {
		expect(shouldOpenMapContextMenu({x: 10, y: 20}, {x: 40, y: 20})).toBe(
			false,
		);
	});
});

describe("isMapContextMenuKeyboardEvent", () => {
	it("accepts Shift+F10 and the context-menu key", () => {
		expect(
			isMapContextMenuKeyboardEvent({key: "F10", shiftKey: true}),
		).toBe(true);
		expect(
			isMapContextMenuKeyboardEvent({
				key: "ContextMenu",
				shiftKey: false,
			}),
		).toBe(true);
		expect(
			isMapContextMenuKeyboardEvent({key: "F10", shiftKey: false}),
		).toBe(false);
	});
});

describe("eventTargetIsInMap", () => {
	it("requires the event target to sit inside the map target", () => {
		const mapTarget = document.createElement("div");
		const canvas = document.createElement("canvas");
		const outside = document.createElement("button");
		mapTarget.append(canvas);

		expect(eventTargetIsInMap(canvas, mapTarget)).toBe(true);
		expect(eventTargetIsInMap(outside, mapTarget)).toBe(false);
		expect(eventTargetIsInMap(canvas, null)).toBe(false);
	});
});

describe("eventPointIsOverMap", () => {
	it("uses the map target box, not the event target", () => {
		const mapTarget = document.createElement("div");
		mapTarget.getBoundingClientRect = () => ({
			left: 0,
			top: 0,
			right: 200,
			bottom: 200,
			width: 200,
			height: 200,
			x: 0,
			y: 0,
			toJSON() {
				return {};
			},
		});

		expect(eventPointIsOverMap({x: 40, y: 50}, mapTarget)).toBe(true);
		expect(eventPointIsOverMap({x: 400, y: 50}, mapTarget)).toBe(false);
		expect(eventPointIsOverMap({x: 40, y: 50}, null)).toBe(false);
	});
});

describe("eventTargetIsInteractiveOverlay", () => {
	it("treats overlay buttons as chrome, not the map", () => {
		const button = document.createElement("button");
		button.className = "ms3-map-overlay__button";
		expect(eventTargetIsInteractiveOverlay(button)).toBe(true);
		expect(
			eventTargetIsInteractiveOverlay(document.createElement("div")),
		).toBe(false);
	});

	it("does not treat the context menu itself as overlay chrome", () => {
		const popover = document.createElement("div");
		popover.className = "ms3-map-point-menu__popover";
		const item = document.createElement("button");
		popover.append(item);
		expect(eventTargetIsInteractiveOverlay(item)).toBe(false);
	});
});

describe("ensureMarkedPointLayerAction", () => {
	it("omits style when the caller did not pass markerStyle", () => {
		const action = ensureMarkedPointLayerAction({
			pluginName: "sharePositionLink",
		});
		expect(JSON.stringify(action)).not.toContain('"style"');
	});

	it("points the layer source at the configured controllers", () => {
		const action = ensureMarkedPointLayerAction({
			pluginName: "sharePositionLink",
			featureSourcesControllerName: "customSources",
			featureSelectionsControllerName: "customSelections",
		});
		const json = JSON.stringify(action);
		expect(json).toContain("customSources");
		expect(json).toContain("customSelections");
	});
});

describe("eventTargetIsInMapMenu", () => {
	it("recognizes the context menu popover", () => {
		const popover = document.createElement("div");
		popover.className = "ms3-map-point-menu__popover";
		const item = document.createElement("button");
		popover.append(item);
		expect(eventTargetIsInMapMenu(item)).toBe(true);
		expect(eventTargetIsInMapMenu(document.createElement("div"))).toBe(
			false,
		);
	});
});

describe("markedPointSourceId", () => {
	it("reuses the share-position draw source name", () => {
		expect(markedPointSourceId("sharePositionLink")).toBe(
			"sharePositionLink_featureSource",
		);
	});
});
