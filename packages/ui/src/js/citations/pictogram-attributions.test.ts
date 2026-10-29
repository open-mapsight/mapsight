import {getPictogramSourceLicense} from "@mapsight/traffic-style/pictograms";
import {describe, expect, it} from "vitest";

import {pictogramAttributionsFromIconIds} from "./pictogram-attributions";

const fontAwesome = getPictogramSourceLicense("fontawesome");

describe("pictogramAttributionsFromIconIds", () => {
	it("maps fa-* compact ids to one Font Awesome pictogram attribution", () => {
		expect(
			pictogramAttributionsFromIconIds([
				"fa-bolt",
				"fa-car-bus/#035799/#ffffff",
				"museum",
				"p",
			]),
		).toEqual([fontAwesome]);
	});

	it("returns no pictogram attribution when no Font Awesome id is in play", () => {
		expect(
			pictogramAttributionsFromIconIds(["museum", "haltestelle"]),
		).toEqual([]);
	});
});
