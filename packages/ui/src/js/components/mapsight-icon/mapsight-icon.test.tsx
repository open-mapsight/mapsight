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
