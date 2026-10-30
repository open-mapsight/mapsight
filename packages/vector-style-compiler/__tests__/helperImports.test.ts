import {describe, expect, it} from "vitest";

import createHelperImportsFromProgram from "../src/js/helpers/createHelperImportsFromProgram.ts";

describe("createHelperImportsFromProgram", () => {
	it("imports runtime icon helpers when referenced in compiled programs", () => {
		const imports = createHelperImportsFromProgram(
			`if (props['mapsightIconId']) {
				d.icon.src = { value: '' + (mapsightRuntimeIcon(props['mapsightIconId'], "default")) + '' };
			}`,
		);
		expect(imports).toContain("mapsightRuntimeIcon");
		expect(imports).toContain("@mapsight/traffic-style/runtime");
	});
});

it("imports the catalog dimension helper for icon size expressions", () => {
	const imports = createHelperImportsFromProgram(
		'mapsightRuntimeIconSize(props["mapsightIconId"], "small", "width")',
	);
	expect(imports).toContain(
		"import { mapsightRuntimeIconSize } from '@mapsight/traffic-style/runtime'",
	);
});
