import assert from "node:assert/strict";
import {describe, it} from "node:test";

import config, {
	PRETTIER_WRITE,
	getPackageInfo,
	runInPackage,
} from "./lint-staged.mts";

describe("getPackageInfo", () => {
	it("resolves public package paths", () => {
		assert.deepEqual(getPackageInfo("/repo/packages/core/src/index.ts"), {
			filter: "core",
			relativePath: "src/index.ts",
		});
	});

	it("resolves private package paths", () => {
		assert.deepEqual(
			getPackageInfo("/repo/private/packages/foo/src/index.ts"),
			{filter: "foo", relativePath: "src/index.ts"},
		);
	});

	it("returns null for paths outside packages or apps", () => {
		assert.equal(getPackageInfo("/repo/scripts/check.mts"), null);
	});
});

describe("runInPackage", () => {
	it("groups files by package filter and passes relative paths", () => {
		const commands = runInPackage("lint --fix")([
			"/repo/packages/core/src/a.ts",
			"/repo/packages/core/src/b.ts",
			"/repo/packages/ui/src/c.tsx",
		]);

		assert.deepEqual(commands, [
			"pnpm --filter core run lint --fix -- src/a.ts src/b.ts",
			"pnpm --filter ui run lint --fix -- src/c.tsx",
		]);
	});

	it("omits file args when passFiles is false", () => {
		const commands = runInPackage("typecheck", {passFiles: false})([
			"/repo/packages/core/src/a.ts",
		]);

		assert.deepEqual(commands, ["pnpm --filter core run typecheck"]);
	});
});

describe("lint-staged config", () => {
	it("uses a shared prettier write command", () => {
		const jsTasks = config["*.{js,mjs,cjs,ts,mts,cts,tsx}"];
		assert(Array.isArray(jsTasks));
		assert.equal(jsTasks[0], PRETTIER_WRITE);
		assert.equal(jsTasks[2], PRETTIER_WRITE);
		assert.equal(config["*.{json,md}"], PRETTIER_WRITE);
	});
});
