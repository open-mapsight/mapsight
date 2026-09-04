import {cleanup, render} from "@testing-library/react";
import {afterEach, describe, expect, it, vi} from "vitest";

import MapsightIcon from "./mapsight-icon";

vi.mock("../../hooks/useMapsightIcon", () => ({
	useMapsightIcon: (id: string) => ({
		src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(id)}`,
		bitmap: null,
		loading: false,
		error: null,
	}),
}));

afterEach(cleanup);

describe("MapsightIcon", () => {
	it("renders a composable id through the SVG path", () => {
		const {container} = render(
			<MapsightIcon id="museum/#be123c/#ffffff" />,
		);
		const src = container.querySelector("img")?.getAttribute("src") ?? "";

		expect(src).toContain("data:image/svg+xml;charset=utf-8,");
		expect(src).not.toContain("-plain.png");
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
