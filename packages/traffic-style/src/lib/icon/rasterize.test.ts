import {describe, expect, it} from "vitest";

import {prepareSvgForRasterization} from "./rasterize.ts";

describe("prepareSvgForRasterization", () => {
	it("sets physical pixel dimensions on the root svg element", () => {
		const svg =
			'<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40"/></svg>';
		const result = prepareSvgForRasterization(svg, 80, 80);
		expect(result).toContain('width="80"');
		expect(result).toContain('height="80"');
		expect(result).toContain('viewBox="0 0 40 40"');
	});
});
