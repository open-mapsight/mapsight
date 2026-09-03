import {describe, expect, it} from "vitest";

import {
	VIEW_DESKTOP,
	VIEW_FULLSCREEN,
	VIEW_MAP_ONLY,
	VIEW_MOBILE,
} from "../config/constants/app";
import {isOverlayChromeView, pairedView} from "./view-pairing";

describe("isOverlayChromeView", () => {
	it("is true only for fullscreen and mapOnly", () => {
		expect(isOverlayChromeView(VIEW_FULLSCREEN)).toBe(true);
		expect(isOverlayChromeView(VIEW_MAP_ONLY)).toBe(true);
		expect(isOverlayChromeView(VIEW_DESKTOP)).toBe(false);
		expect(isOverlayChromeView(VIEW_MOBILE)).toBe(false);
	});
});

describe("pairedView", () => {
	it("pairs overlay chrome with the in-flow view it left", () => {
		expect(pairedView(VIEW_FULLSCREEN)).toBe(VIEW_DESKTOP);
		expect(pairedView(VIEW_MAP_ONLY)).toBe(VIEW_MOBILE);
		expect(pairedView(VIEW_DESKTOP)).toBe(VIEW_FULLSCREEN);
		expect(pairedView(VIEW_MOBILE)).toBe(VIEW_MAP_ONLY);
	});
});
