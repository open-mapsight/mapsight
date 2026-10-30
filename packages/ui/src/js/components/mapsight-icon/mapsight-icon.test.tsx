import "@mapsight/traffic-style/pictograms-fontawesome";

import {cleanup, render} from "@testing-library/react";
import {afterEach, describe, expect, it} from "vitest";

import MapsightIcon from "./mapsight-icon";

afterEach(cleanup);

describe("MapsightIcon", () => {
	it("renders a composable id as an SVG data URL on the first paint", () => {
		const {container} = render(
			<MapsightIcon id="museum/#be123c/#ffffff" />,
		);
		const img = container.querySelector("img");

		expect(img).toBeInstanceOf(HTMLImageElement);
		expect(img?.getAttribute("src") ?? "").toContain(
			"data:image/svg+xml;charset=utf-8,",
		);
		expect(img?.getAttribute("width")).toBe("40");
		expect(img?.getAttribute("height")).toBe("40");
	});

	it("renders a sprite id as a PNG from imagesUrl", () => {
		const {container} = render(<MapsightIcon id="baustelle" />);
		const img = container.querySelector("img");

		expect(img?.getAttribute("src")).toBe(
			"/images/mapsight-icons/baustelle-plain.png",
		);
	});

	it("composes a colored custom pictogram id instead of a slashed sprite URL", () => {
		const {container} = render(<MapsightIcon id="my-poi/#035799" />);
		const src = container.querySelector("img")?.getAttribute("src") ?? "";

		expect(src).toContain("data:image/svg+xml;charset=utf-8,");
		expect(src).not.toContain("-plain.png");
		expect(src).not.toContain("my-poi/");
	});

	it("renders compact 1–2 character labels as SVG, not PNGs", () => {
		for (const id of ["10", "P2", "t"]) {
			const {container} = render(<MapsightIcon id={id} />);
			const src =
				container.querySelector("img")?.getAttribute("src") ?? "";
			expect(src, id).toContain("data:image/svg+xml;charset=utf-8,");
			expect(src, id).not.toContain("-plain.png");
		}
	});

	it("renders nothing without an id", () => {
		const {container} = render(<MapsightIcon id={undefined} />);
		expect(container.querySelector("img")).toBeNull();
	});
});

it("keeps a wide icon proportional with default and one-sided size overrides", () => {
	for (const [props, width, height] of [
		[{}, (40 * 54) / 34, 40],
		[{height: 34}, 54, 34],
		[{width: 54}, 54, 34],
	] as const) {
		const {container} = render(
			<MapsightIcon id="fa-restroom+fa-wheelchair" {...props} />,
		);
		const image = container.querySelector("img");
		expect(Number(image?.getAttribute("width"))).toBeCloseTo(width);
		expect(Number(image?.getAttribute("height"))).toBeCloseTo(height);
		expect(image?.getAttribute("src")).toContain("data:image/svg+xml");
	}
});

it("uses registered custom compositions even without colors in the id", async () => {
	const {registerPictograms} =
		await import("@mapsight/traffic-style/pictograms");
	const glyph = {
		viewBox: "0 0 10 10",
		markup: '<path d="M0 0h10v10H0z"/>',
		source: "traffic-style" as const,
	};
	registerPictograms([
		{
			id: "host-wide",
			source: "traffic-style",
			composition: {layout: "horizontal", glyphs: [glyph, glyph]},
		},
	]);
	const {container} = render(<MapsightIcon id="host-wide" height={34} />);
	expect(container.querySelector("img")?.getAttribute("width")).toBe("54");
});
