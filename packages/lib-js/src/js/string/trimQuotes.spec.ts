import {deepStrictEqual} from "assert";

import {describe, it} from "vitest";

import trimQuotes from "./trimQuotes.ts";

describe("trimQuotes", () => {
	it("trims surrounding quotes", () => {
		deepStrictEqual(trimQuotes('"hello"'), "hello");
		deepStrictEqual(trimQuotes("'world'"), "world");
		deepStrictEqual(trimQuotes('""'), "");
		deepStrictEqual(trimQuotes("''"), "");
	});

	it("leaves unquoted unchanged", () => {
		deepStrictEqual(trimQuotes("hello"), "hello");
		deepStrictEqual(trimQuotes('"hel"lo"'), 'hel"lo');
	});
});
