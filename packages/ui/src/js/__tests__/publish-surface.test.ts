import {readFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

import {describe, expect, it} from "vitest";

const packageRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../..",
);

describe("npm publish surface", () => {
	it("includes src/scss for host integrator Sass builds", () => {
		const pkg = JSON.parse(
			readFileSync(path.join(packageRoot, "package.json"), "utf8"),
		) as {files?: string[]};

		expect(pkg.files).toContain("src/scss");
	});

	it("ships default.scss entry used by starters", () => {
		expect(
			readFileSync(
				path.join(packageRoot, "src/scss/default.scss"),
				"utf8",
			),
		).toContain('@use "variables"');
	});
});
