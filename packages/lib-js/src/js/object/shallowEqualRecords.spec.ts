import {strictEqual} from "assert";

import {describe, it} from "vitest";

import shallowEqualRecords from "./shallowEqualRecords.ts";

describe("shallowEqualRecords", () => {
	it("returns true for the same reference", () => {
		const record = {a: "1", b: "2"};
		strictEqual(shallowEqualRecords(record, record), true);
	});

	it("returns true for equal values with different references", () => {
		strictEqual(
			shallowEqualRecords({a: "1", b: "2"}, {a: "1", b: "2"}),
			true,
		);
	});

	it("returns false when values differ", () => {
		strictEqual(shallowEqualRecords({a: "1"}, {a: "2"}), false);
	});

	it("returns false when keys differ", () => {
		strictEqual(shallowEqualRecords({a: "1"}, {a: "1", b: "2"}), false);
	});

	it("returns false when one side is undefined", () => {
		strictEqual(shallowEqualRecords({a: "1"}, undefined), false);
		strictEqual(shallowEqualRecords(undefined, undefined), true);
	});
});
