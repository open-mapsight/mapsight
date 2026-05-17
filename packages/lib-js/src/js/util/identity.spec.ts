import {deepStrictEqual, strictEqual} from "assert";

import {describe, it} from "vitest";

import identity from "./identity.ts";

describe("identity", () => {
	it("returns the input unchanged", () => {
		strictEqual(identity(42), 42);
		strictEqual(identity("hello"), "hello");
		const obj = {};
		strictEqual(identity(obj), obj);
		deepStrictEqual(identity([1, 2]), [1, 2]);
	});
});
