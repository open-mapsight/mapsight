import {describe, expect, it} from "vitest";

import {getPictogramSourceLicense} from "./license.ts";

describe("getPictogramSourceLicense", () => {
	it("returns the Font Awesome pictogram attribution record", () => {
		expect(getPictogramSourceLicense("fontawesome")).toEqual({
			source: "fontawesome",
			title: "Font Awesome",
			license: "CC BY 4.0",
			licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
			homepageUrl: "https://fontawesome.com",
			modificationNotice: {
				de: "Darstellung verändert.",
				en: "adapted.",
			},
			creator: "Fonticons, Inc. / Dave Gandy",
		});
	});

	it("leaves traffic-style native pictograms uncredited in the UI", () => {
		expect(getPictogramSourceLicense("traffic-style")).toBeUndefined();
	});
});
