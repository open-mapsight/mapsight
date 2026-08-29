import {describe, expect, it} from "vitest";

import type {MapsightUiFeature} from "../../types";
import {buildPlacePageMeta} from "./build-place-page-meta";

function feature(
	overrides: Partial<MapsightUiFeature> & {
		properties?: Record<string, unknown>;
	} = {},
): MapsightUiFeature {
	return {
		type: "Feature",
		id: "poi-1",
		geometry: {type: "Point", coordinates: [10.52, 52.26]},
		...overrides,
		properties: {
			id: "poi-1",
			name: "Rathaus",
			...overrides.properties,
		},
	} as MapsightUiFeature;
}

const location = {
	origin: "https://www.example.de",
	pathname: "/plan",
	search: "?module=home",
};

describe("buildPlacePageMeta", () => {
	it("builds title, permalink canonical, and Place JSON-LD", () => {
		const meta = buildPlacePageMeta(feature(), {
			location,
			ogImage: "https://www.example.de/plan/img/og-default.png",
			navigation: {fromGeometry: false},
		});

		expect(meta).toMatchObject({
			title: "Rathaus",
			canonicalUrl:
				"https://www.example.de/plan?module=home&feature=poi-1",
			og: {
				type: "place",
				url: "https://www.example.de/plan?module=home&feature=poi-1",
				image: "https://www.example.de/plan/img/og-default.png",
			},
			jsonLd: {
				"@context": "https://schema.org",
				"@type": "Place",
				name: "Rathaus",
				geo: {
					"@type": "GeoCoordinates",
					latitude: 52.26,
					longitude: 10.52,
				},
			},
		});
		expect(meta?.jsonLd.url).toBeUndefined();
	});

	it("prefers permanentLink for canonical and keeps schema.url on JSON-LD only", () => {
		const meta = buildPlacePageMeta(
			feature({
				properties: {
					id: "poi-1",
					name: "Rathaus",
					permanentLink: "https://www.example.de/rathaus",
					schema: {
						url: "https://www.rathaus.example/",
						telephone: "+49 531 1",
					},
				},
			}),
			{
				location,
				ogImage: "/plan/img/og-default.png",
			},
		);

		expect(meta?.canonicalUrl).toBe("https://www.example.de/rathaus");
		expect(meta?.og.url).toBe("https://www.example.de/rathaus");
		expect(meta?.jsonLd.url).toBe("https://www.rathaus.example/");
		expect(meta?.jsonLd.telephone).toBe("+49 531 1");
	});

	it("strips HTML from description and caps length", () => {
		const meta = buildPlacePageMeta(
			feature({
				properties: {
					id: "poi-1",
					name: "Rathaus",
					description: `<p>${"x".repeat(250)}</p>`,
				},
			}),
			{
				location,
				ogImage: "/og.png",
			},
		);

		expect(meta?.description.startsWith("x")).toBe(true);
		expect(meta?.description.endsWith("…")).toBe(true);
		expect(meta?.description.length).toBeLessThanOrEqual(180);
		expect(meta?.description.includes("<")).toBe(false);
	});

	it("returns null when the feature has no title", () => {
		expect(
			buildPlacePageMeta(
				feature({
					id: "x",
					properties: {id: "x", name: "  "},
				}),
				{location, ogImage: "/og.png"},
			),
		).toBeNull();
	});
});
