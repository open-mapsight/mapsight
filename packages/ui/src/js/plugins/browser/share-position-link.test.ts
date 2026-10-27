import {fromLonLat} from "ol/proj";

import {describe, expect, it, vi} from "vitest";

import {createFilteredFeatureSourceSelector} from "@mapsight/core/lib/feature-sources/selectors";
import type {MapController} from "@mapsight/core/lib/map/controller";

import {create} from "../../index";
import {getKeyboardDraw} from "../common/measure-distance";
import {markedPointSourceId} from "./marked-point";
import createSharePositionPlugin, {
	buildLinkMarkerShareHref,
	createActivateAction,
	formatLinkMarkerHash,
	lonLatFromDrawnGeometry,
	parseLinkMarkerHash,
	shareMapCenter,
} from "./share-position-link";

describe("parseLinkMarkerHash", () => {
	it("reads lat/lon from the share hash", () => {
		expect(parseLinkMarkerHash("#lm=52.2647/10.5236")).toEqual({
			lat: 52.2647,
			lon: 10.5236,
		});
	});

	it("ignores a missing or unrelated hash", () => {
		expect(parseLinkMarkerHash("")).toBeNull();
		expect(parseLinkMarkerHash("#other=1")).toBeNull();
	});

	it("keeps near-zero coordinates in decimal form", () => {
		expect(formatLinkMarkerHash(0.000123, -0.000123)).toBe(
			"#lm=0.000123/-0.000123",
		);
		expect(parseLinkMarkerHash("#lm=0.000123/-0.000123")).toEqual({
			lat: 0.000123,
			lon: -0.000123,
		});
	});

	it("reads negative southern and western coordinates", () => {
		expect(parseLinkMarkerHash("#lm=-33.8688/-70.6693")).toEqual({
			lat: -33.8688,
			lon: -70.6693,
		});
		expect(
			parseLinkMarkerHash(formatLinkMarkerHash(-33.8688, -70.6693)),
		).toEqual({
			lat: -33.8688,
			lon: -70.6693,
		});
	});
});

describe("buildLinkMarkerShareHref", () => {
	it("writes the same #lm hash as the overlay tool", () => {
		expect(formatLinkMarkerHash(52.2647, 10.5236)).toBe(
			"#lm=52.2647/10.5236",
		);
		expect(
			buildLinkMarkerShareHref(52.2647, 10.5236, {
				origin: "https://example.de",
				pathname: "/plan",
				search: "?module=home",
			}),
		).toBe("https://example.de/plan?module=home#lm=52.2647/10.5236");
	});
});

describe("share-position-link source", () => {
	it("writes the hash marker into the same source as draw and mark", () => {
		expect(markedPointSourceId("sharePositionLink")).toBe(
			"sharePositionLink_featureSource",
		);
	});
});

describe("lonLatFromDrawnGeometry", () => {
	it("keeps WGS84 draw coordinates as lon/lat", () => {
		expect(
			lonLatFromDrawnGeometry({
				type: "Point",
				coordinates: [10.5236, 52.2647],
			}),
		).toEqual({lon: 10.5236, lat: 52.2647});
	});

	it("converts map-projection draw coordinates to WGS84", () => {
		const [x, y] = fromLonLat([10.5236, 52.2647]);
		expect(
			lonLatFromDrawnGeometry({
				type: "Point",
				coordinates: [x, y],
			}),
		).toEqual({
			lon: expect.closeTo(10.5236, 5),
			lat: expect.closeTo(52.2647, 5),
		});
	});
});

describe("share position keyboard drawing", () => {
	it.each([undefined, true, false])(
		"supports keyboardDrawing=%s (default true)",
		(keyboardDrawing) => {
			const context = create(
				null,
				vi.fn(),
				{map: {layers: {}}},
				{
					renderer: vi.fn(),
					validateConfig: false,
					plugins: [
						[
							"share",
							createSharePositionPlugin({
								keyboardDrawing,
								showMarker: false,
							}),
						],
					],
				},
			);
			const map = (
				context.store!.getController("map") as MapController
			).getMap()!;
			try {
				expect(!!getKeyboardDraw(map, "sharePositionLink")).toBe(
					keyboardDrawing !== false,
				);
			} finally {
				map.dispose();
			}
		},
	);

	it("shares the current centre with custom source, name and marker configuration", () => {
		const context = create(
			null,
			vi.fn(),
			{map: {layers: {}}},
			{
				renderer: vi.fn(),
				validateConfig: false,
				plugins: [
					[
						"share",
						createSharePositionPlugin({
							name: "hostShare",
							markerName: "Host marker",
							markerFeatureId: "host-marker",
							showMarker: false,
						}),
					],
				],
			},
		);
		const store = context.store!;
		const map = (store.getController("map") as MapController).getMap()!;
		try {
			store.dispatch(createActivateAction("map", "hostShare"));
			map.getView().setCenter(fromLonLat([10.5, 52.2]));
			shareMapCenter(store, "hostShare");
			const source = createFilteredFeatureSourceSelector(
				"featureSources",
				"hostShare_featureSource",
				"map",
			)(store.getState());
			expect(source?.data?.features?.[0]).toMatchObject({
				id: "host-marker",
				geometry: {
					type: "Point",
					coordinates: [expect.closeTo(10.5), expect.closeTo(52.2)],
				},
				properties: {name: "Host marker"},
			});
			expect(getKeyboardDraw(map, "hostShare")?.getActive()).toBe(true);
		} finally {
			map.dispose();
		}
	});
});
