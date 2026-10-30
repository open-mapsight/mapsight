import {describe, expect, it} from "vitest";

import type {MapsightUiFeature} from "../types";
import {resolveFeaturePermalink} from "./permalink";

const location = {
	origin: "https://maps.example",
	pathname: "/karte",
	search: "",
};

function feature(properties: Record<string, unknown> = {}): MapsightUiFeature {
	return {
		type: "Feature",
		id: "school-1",
		geometry: {type: "Point", coordinates: [10, 52]},
		properties,
	} as MapsightUiFeature;
}

const unsafeHrefs = [
	"javascript:alert(1)",
	" JavaScript:alert(1)",
	"java\tscript:alert(1)",
	"data:text/html,<script>alert(1)</script>",
	"vbscript:msgbox(1)",
];

describe("resolveFeaturePermalink", () => {
	it.each([
		"https://example.com/schule",
		"http://example.com/schule",
		"/schulen/1",
		"schulen/1",
		"?feature=1",
	])("keeps the safe permanentLink %s", (href) => {
		expect(
			resolveFeaturePermalink(feature({permanentLink: href}), {location}),
		).toBe(href);
	});

	it.each(unsafeHrefs)(
		"falls back to the location permalink for permanentLink %s",
		(href) => {
			expect(
				resolveFeaturePermalink(feature({permanentLink: href}), {
					location,
				}),
			).toBe("https://maps.example/karte?feature=school-1");
		},
	);

	it.each(unsafeHrefs)("drops a configured permalink string %s", (href) => {
		expect(
			resolveFeaturePermalink(feature(), {location, permalink: href}),
		).toBeNull();
	});

	it.each(unsafeHrefs)(
		"drops a configured permalink function result %s",
		(href) => {
			expect(
				resolveFeaturePermalink(feature(), {
					location,
					permalink: () => href,
				}),
			).toBeNull();
		},
	);

	it("keeps a safe configured permalink function result", () => {
		expect(
			resolveFeaturePermalink(feature(), {
				location,
				permalink: (f) => `/orte/${String(f.id)}`,
			}),
		).toBe("/orte/school-1");
	});
});
