import {expect, it} from "vitest";

import {
	VOLATILE_CALC_HELPERS,
	containsVolatileCalcHelper,
} from "../src/js/helpers/volatileCalcHelpers.ts";

it("lists registered volatile calc helpers", () => {
	expect(VOLATILE_CALC_HELPERS).toEqual(["mapsightRuntimeIcon"]);
});

it("detects volatile calc helper calls", () => {
	expect(
		containsVolatileCalcHelper(
			'mapsightRuntimeIcon(props["mapsightIconId"], "small")',
		),
	).toBe(true);
	expect(containsVolatileCalcHelper("zoom * 2 + props['test']")).toBe(false);
});
