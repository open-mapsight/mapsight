import {deepStrictEqual} from "assert";

import {describe, it} from "vitest";

import isNumberLike from "./isNumberLike.ts";

describe("isNumberLike", () => {
	it("returns true for number-like values", () => {
		deepStrictEqual(isNumberLike(42), true);
		deepStrictEqual(isNumberLike("42"), true);
		deepStrictEqual(isNumberLike("0"), true);
		deepStrictEqual(isNumberLike("-3.14"), true);
		deepStrictEqual(isNumberLike(1.5), true);
	});

	it("returns false for non-number-like", () => {
		deepStrictEqual(isNumberLike("42a"), false);
		deepStrictEqual(isNumberLike("abc"), false);
		deepStrictEqual(isNumberLike({}), false);
		deepStrictEqual(isNumberLike(null), false);
		deepStrictEqual(isNumberLike([]), false);
	});
});
