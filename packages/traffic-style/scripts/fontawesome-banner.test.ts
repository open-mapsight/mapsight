import {readFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {describe, expect, it} from "vitest";

const generated = readFileSync(
	path.resolve(
		path.dirname(fileURLToPath(import.meta.url)),
		"../src/generated/pictograms/fontawesome.ts",
	),
	"utf8",
);

describe("generated Font Awesome pictogram banner", () => {
	it("keeps the Free / CC BY 4.0 / extracted / do-not-strip notice", () => {
		expect(generated).toContain("Font Awesome Free");
		expect(generated).toContain("CC BY 4.0");
		expect(generated).toContain(
			"https://creativecommons.org/licenses/by/4.0/",
		);
		expect(generated).toContain("Extracted and adapted");
		expect(generated).toContain("@fortawesome/free-solid-svg-icons");
		expect(generated).toContain("Do not strip this notice");
	});
});
