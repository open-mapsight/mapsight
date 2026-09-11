import {describe, expect, it} from "vitest";

import type {MapsightUiFeature} from "../../types";
import {
	resolveFeatureSchema,
	resolvePlaceActions,
} from "./resolve-place-actions";
import type {PlaceActionsConfig} from "./types";

function feature(
	overrides: Partial<MapsightUiFeature> & {
		properties?: Record<string, unknown>;
	} = {},
): MapsightUiFeature {
	return {
		type: "Feature",
		id: "schlosspark",
		geometry: {type: "Point", coordinates: [10.52, 52.26]},
		...overrides,
		properties: {
			id: "schlosspark",
			name: "Schlosspark",
			...overrides.properties,
		},
	} as MapsightUiFeature;
}

const location: NonNullable<PlaceActionsConfig["location"]> = {
	origin: "https://example.de",
	pathname: "/plan",
	search: "?module=home",
};

describe("resolveFeatureSchema", () => {
	it("defaults @type to Place without stamping the feature", () => {
		const poi = feature({
			properties: {
				id: "schlosspark",
				schema: {url: "https://www.example.de/schlosspark"},
			},
		});

		expect(resolveFeatureSchema(poi)["@type"]).toBe("Place");
		expect(
			(poi.properties.schema as {["@type"]?: string})["@type"],
		).toBeUndefined();
	});

	it("lets the feature override collection schemaDefault @type", () => {
		const poi = feature({
			properties: {
				id: "p1",
				schema: {"@type": "ParkingFacility", telephone: "+49 531 1"},
			},
		});

		expect(
			resolveFeatureSchema(poi, {
				schemaDefault: {"@type": "CivicStructure"},
			})["@type"],
		).toBe("ParkingFacility");
	});

	it("uses collection schemaDefault @type when the feature omits @type", () => {
		const poi = feature({
			properties: {
				id: "p1",
				schema: {telephone: "+49 531 1"},
			},
		});

		expect(
			resolveFeatureSchema(poi, {
				schemaDefault: {"@type": "ParkingFacility"},
			})["@type"],
		).toBe("ParkingFacility");
	});

	it("ignores extra schema.org keys", () => {
		const poi = feature({
			properties: {
				id: "schlosspark",
				schema: {
					url: "https://www.example.de/schlosspark",
					openingHours: "Mo-Fr 09:00-18:00",
					address: {streetAddress: "Schlossplatz"},
				},
			},
		});

		expect(resolveFeatureSchema(poi)).toEqual({
			"@type": "Place",
			url: "https://www.example.de/schlosspark",
		});
	});
});

describe("resolvePlaceActions", () => {
	it("reads website and call only from properties.schema", () => {
		const actions = resolvePlaceActions(
			feature({
				properties: {
					id: "schlosspark",
					detailsUrl: "/cms/schlosspark",
					schema: {
						url: "https://www.example.de/schlosspark",
						telephone: "+49 531 470 1",
					},
				},
			}),
			{
				permalink: () => null,
				showOnMap: false,
				navigation: {fromGeometry: false},
			},
		);

		expect(actions).toEqual([
			{kind: "website", href: "https://www.example.de/schlosspark"},
			{
				kind: "call",
				href: "tel:+495314701",
				telephone: "+49 531 470 1",
			},
		]);
	});

	it("omits website and call when schema url/tel are absent", () => {
		const actions = resolvePlaceActions(
			feature({
				properties: {
					id: "schlosspark",
					detailsUrl: "/cms/schlosspark",
				},
			}),
			{
				permalink: () => null,
				showOnMap: false,
				navigation: {fromGeometry: false},
			},
		);

		expect(actions).toEqual([]);
	});

	it("omits website when schema.url is not http(s)", () => {
		for (const url of [
			"javascript:alert(1)",
			"data:text/html,hi",
			"mailto:info@example.de",
			"/relative/path",
		]) {
			const actions = resolvePlaceActions(
				feature({
					properties: {
						id: "schlosspark",
						schema: {url},
					},
				}),
				{permalink: () => null, navigation: {fromGeometry: false}},
			);

			expect(
				actions.find((action) => action.kind === "website"),
			).toBeUndefined();
		}
	});

	it("never treats detailsUrl as a website", () => {
		const actions = resolvePlaceActions(
			feature({
				properties: {
					id: "schlosspark",
					detailsUrl: "https://www.example.de/cms/schlosspark",
				},
			}),
			{permalink: () => null, navigation: {fromGeometry: false}},
		);

		expect(
			actions.find((action) => action.kind === "website"),
		).toBeUndefined();
	});

	it("prefers permanentLink for share", () => {
		const actions = resolvePlaceActions(
			feature({
				properties: {
					id: "schlosspark",
					permanentLink: "https://example.de/poi/schlosspark",
				},
			}),
			{location, navigation: {fromGeometry: false}},
		);

		expect(actions.find((action) => action.kind === "share")).toEqual({
			kind: "share",
			href: "https://example.de/poi/schlosspark",
			title: "Schlosspark",
		});
	});

	it("falls back to origin + path + existing search + ?feature=", () => {
		const actions = resolvePlaceActions(feature(), {
			location,
			navigation: {fromGeometry: false},
		});

		expect(actions.find((action) => action.kind === "share")).toEqual({
			kind: "share",
			href: "https://example.de/plan?module=home&feature=schlosspark",
			title: "Schlosspark",
		});
	});

	it("keeps an existing feature param in the permalink fallback", () => {
		const actions = resolvePlaceActions(feature(), {
			location: {
				...location,
				search: "?module=home&feature=old",
			},
			navigation: {fromGeometry: false},
		});

		expect(actions.find((action) => action.kind === "share")).toMatchObject(
			{
				href: "https://example.de/plan?module=home&feature=schlosspark",
			},
		);
	});

	it("omits share when no permalink can be built", () => {
		const actions = resolvePlaceActions(
			feature({id: "", properties: {id: "", name: "x"}}),
			{location: null, navigation: {fromGeometry: false}},
		);

		expect(
			actions.find((action) => action.kind === "share"),
		).toBeUndefined();
	});

	it("omits empty actions and ignores extra schema keys for UI", () => {
		const actions = resolvePlaceActions(
			feature({
				properties: {
					id: "schlosspark",
					schema: {
						openingHours: "Mo-Fr",
						email: "info@example.de",
					},
				},
			}),
			{
				permalink: () => null,
				showOnMap: false,
				navigation: {fromGeometry: false},
			},
		);

		expect(actions).toEqual([]);
	});

	it("builds default navigate targets from point geometry without geo on desktop", () => {
		const actions = resolvePlaceActions(feature(), {
			permalink: () => null,
			navigation: {supportsGeo: false},
		});
		const navigate = actions.find((action) => action.kind === "navigate");

		expect(navigate).toMatchObject({
			kind: "navigate",
			targets: [
				{
					id: "google",
					href: "https://www.google.com/maps/dir/?api=1&destination=52.26,10.52",
				},
				{
					id: "apple",
					href: "https://maps.apple.com/?daddr=52.26,10.52",
				},
			],
		});
	});

	it("includes geo: only when the client can handle the protocol", () => {
		const withGeo = resolvePlaceActions(feature(), {
			permalink: () => null,
			navigation: {supportsGeo: true},
		});
		const withoutGeo = resolvePlaceActions(feature(), {
			permalink: () => null,
			navigation: {supportsGeo: false},
		});

		expect(
			withGeo
				.find((action) => action.kind === "navigate")
				?.targets.map((target) => target.id),
		).toEqual(["geo", "google", "apple"]);
		expect(
			withoutGeo
				.find((action) => action.kind === "navigate")
				?.targets.map((target) => target.id),
		).toEqual(["google", "apple"]);
	});

	it("adds copy coordinates only for the shared link-marker", () => {
		expect(
			resolvePlaceActions(feature(), {
				permalink: () => null,
				showOnMap: false,
				navigation: {fromGeometry: false},
			}).find((action) => action.kind === "copyCoords"),
		).toBeUndefined();

		const marker = feature({
			id: "link-marker",
			properties: {id: "link-marker", name: "Pin"},
		});
		expect(
			resolvePlaceActions(marker, {
				permalink: () => null,
				showOnMap: false,
				navigation: {fromGeometry: false},
			}).find((action) => action.kind === "copyCoords"),
		).toEqual({
			kind: "copyCoords",
			text: "52.260000, 10.520000",
		});
	});

	it("shares a custom-id marked point with the #lm hash", () => {
		const marker = feature({
			id: "host-marker",
			properties: {
				id: "host-marker",
				name: "Pin",
				mapsightMarkedPoint: true,
			},
		});

		expect(
			resolvePlaceActions(marker, {
				location,
				showOnMap: false,
				navigation: {fromGeometry: false},
			}).find((action) => action.kind === "share"),
		).toEqual({
			kind: "share",
			href: "https://example.de/plan?module=home#lm=52.26/10.52",
			title: "Pin",
		});
	});

	it("shares the link-marker with the #lm hash instead of ?feature=", () => {
		const marker = feature({
			id: "link-marker",
			properties: {id: "link-marker", name: "Burgplatz 2"},
		});

		expect(
			resolvePlaceActions(marker, {
				location,
				showOnMap: false,
				navigation: {fromGeometry: false},
			}).find((action) => action.kind === "share"),
		).toEqual({
			kind: "share",
			href: "https://example.de/plan?module=home#lm=52.26/10.52",
			title: "Burgplatz 2",
		});
	});

	it("omits copy coordinates without geometry or when disabled", () => {
		expect(
			resolvePlaceActions(
				feature({geometry: {type: "Point", coordinates: []}}),
				{permalink: () => null, navigation: {fromGeometry: false}},
			).find((action) => action.kind === "copyCoords"),
		).toBeUndefined();

		expect(
			resolvePlaceActions(feature(), {
				permalink: () => null,
				copyCoords: false,
				navigation: {fromGeometry: false},
			}).find((action) => action.kind === "copyCoords"),
		).toBeUndefined();
	});

	it("adds show on map when the feature has a point", () => {
		const actions = resolvePlaceActions(feature(), {
			permalink: () => null,
			navigation: {fromGeometry: false},
		});

		expect(actions.find((action) => action.kind === "showOnMap")).toEqual({
			kind: "showOnMap",
		});
	});

	it("omits show on map without geometry or when disabled", () => {
		expect(
			resolvePlaceActions(
				feature({geometry: {type: "Point", coordinates: []}}),
				{permalink: () => null, navigation: {fromGeometry: false}},
			).find((action) => action.kind === "showOnMap"),
		).toBeUndefined();

		expect(
			resolvePlaceActions(feature(), {
				permalink: () => null,
				showOnMap: false,
				navigation: {fromGeometry: false},
			}).find((action) => action.kind === "showOnMap"),
		).toBeUndefined();
	});

	it("omits navigate when geometry is unused and no address is set", () => {
		const actions = resolvePlaceActions(feature(), {
			permalink: () => null,
			navigation: {fromGeometry: false},
		});

		expect(
			actions.find((action) => action.kind === "navigate"),
		).toBeUndefined();
	});

	it("resolves custom target originHref for from-here", () => {
		const actions = resolvePlaceActions(feature(), {
			permalink: () => null,
			showOnMap: false,
			copyCoords: false,
			navigation: {
				supportsGeo: false,
				targets: [
					{
						id: "bsvg",
						label: "BSVG",
						href: ({lon, lat}) =>
							lon == null || lat == null
								? null
								: `https://example.de/to/${lat},${lon}`,
						originHref: ({lon, lat}) =>
							lon == null || lat == null
								? null
								: `https://example.de/from/${lat},${lon}`,
					},
				],
			},
		});

		expect(
			actions.find((action) => action.kind === "navigate")?.targets,
		).toEqual([
			{
				id: "bsvg",
				label: "BSVG",
				href: "https://example.de/to/52.26,10.52",
				originHref: "https://example.de/from/52.26,10.52",
			},
		]);
	});

	it("lets the host remap the schema group", () => {
		const actions = resolvePlaceActions(
			feature({
				properties: {
					id: "schlosspark",
					website: "https://mapped.example/park",
					phone: "0531 1",
				},
			}),
			{
				permalink: () => null,
				showOnMap: false,
				navigation: {fromGeometry: false},
				schema: (poi) => ({
					url: poi.properties.website as string,
					telephone: poi.properties.phone as string,
				}),
			},
		);

		expect(actions).toEqual([
			{kind: "website", href: "https://mapped.example/park"},
			{kind: "call", href: "tel:05311", telephone: "0531 1"},
		]);
	});
});
