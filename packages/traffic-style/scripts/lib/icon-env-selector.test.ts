import {readFileSync} from "node:fs";
import {resolve} from "node:path";

import {describe, expect, it} from "vitest";

const readScssMixin = (name: string) =>
	readFileSync(resolve(import.meta.dirname, "../../src/scss/mixins", name), "utf8");

describe("env mapsightIconId selectors", () => {
	it("guards auto icon env selectors unless force is requested", () => {
		const scss = readScssMixin("_auto-icon.scss");

		expect(scss).toContain(
			'#{":not([mapsightIconId]) [env|mapsightIconId = " + $iconId + "]"}',
		);
		expect(scss).toContain(
			':not([mapsightIconId]) [env|mapsightIconId="#{$iconId}"]',
		);
		expect(scss).toContain('[env|mapsightIconUse="force"]');
		expect(scss).toContain('[env|mapsightIconId="#{$iconId}"]');
	});

	it("guards runtime icon env selectors unless force is requested", () => {
		const scss = readScssMixin("_runtime-icon.scss");

		expect(scss).toContain(":not([mapsightIconId]) [env|mapsightIconId]");
		expect(scss).toContain('[env|mapsightIconUse="force"]');
	});
});
