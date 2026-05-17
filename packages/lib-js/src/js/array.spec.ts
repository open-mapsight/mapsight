import {deepStrictEqual, throws} from "assert";

import {describe, it} from "vitest";

import {zip} from "./array.ts";

describe("zip", () => {
	it("normal", () => {
		const res = zip([1, 2, 3], [3, 2, 1]);
		deepStrictEqual(res, [
			[1, 3],
			[2, 2],
			[3, 1],
		]);
	});

	it("no input arrays", () => {
		const res = zip();
		deepStrictEqual(res, []);
	});

	it("length mismatch ", () => {
		throws(() => {
			zip([1, 2], [3, 2, 1]);
		});

		throws(() => {
			zip([1, 2, 3], [3, 2]);
		});
	});
});
