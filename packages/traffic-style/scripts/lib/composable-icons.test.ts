import {describe, expect, it} from "vitest";

import {
	buildTargetsFromMapsightIconId,
	composableIconFileName,
	resolveIconColors,
} from "./composable-icons.ts";
import {pictogramPackForIconId} from "./pictogram-packs.ts";

describe("composable-icons", () => {
	it("builds standard filenames", () => {
		expect(composableIconFileName("museum", "default")).toBe(
			"museum-default.png",
		);
	});

	it("auto-picks foreground when only background is set", () => {
		expect(resolveIconColors({background: "#035799"})).toEqual({
			background: "#035799",
			foreground: "#ffffff",
		});
	});

	it("classifies pictogram packs by icon id", () => {
		expect(pictogramPackForIconId("museum")).toBe("traffic-style");
		expect(pictogramPackForIconId("fa-school")).toBe("fontawesome");
	});

	it("expands a compact mapsightIconId into variant targets", () => {
		const targets = buildTargetsFromMapsightIconId("museum/#be123c", [
			"default",
			"plain",
		]);
		expect(targets).toHaveLength(2);
		expect(targets[0]).toMatchObject({
			iconId: "museum",
			variant: "default",
			colors: {
				background: "#be123c",
				foreground: "#ffffff",
			},
		});
	});
});
