import {strictEqual} from "assert";

import {it} from "vitest";

import getQueryStringParameter from "./get-query-string-parameter.ts";
import removeQueryStringParameter from "./remove-query-string-parameter.ts";
import updateQueryStringParameter from "./update-query-string-parameter.ts";

it("getQueryStringParameter", () => {
	strictEqual(
		getQueryStringParameter("/foo?pre=a&key=42&post=b", "key"),
		"42",
	);
	strictEqual(
		getQueryStringParameter("/foo?pre=a&key=42&post=b", "bar"),
		null,
	);

	// test special regex chars in keys
	strictEqual(
		getQueryStringParameter("/foo?pre=a&key.asd=42&post=b", "key.asd"),
		"42",
	);
	strictEqual(
		getQueryStringParameter("/foo?pre=a&key-asd=42&post=b", "key.asd"),
		null,
	);
});

it("removeQueryStringParameter", () => {
	strictEqual(removeQueryStringParameter("/foo?key=42", "key"), "/foo");
	strictEqual(
		removeQueryStringParameter("/foo?pre=a&key=42&post=b", "key"),
		"/foo?pre=a&post=b",
	);
	strictEqual(
		removeQueryStringParameter("/foo?pre=a&key=42&post=b", "bar"),
		"/foo?pre=a&key=42&post=b",
	);

	// test special regex chars in keys
	strictEqual(
		removeQueryStringParameter("/foo?pre=a&key.asd=42&post=b", "key.asd"),
		"/foo?pre=a&post=b",
	);
	strictEqual(
		removeQueryStringParameter("/foo?pre=a&key-asd=42&post=b", "key.asd"),
		"/foo?pre=a&key-asd=42&post=b",
	);
});

it("updateQueryStringParameter", () => {
	strictEqual(
		updateQueryStringParameter("/foo?key=42", "key", "1337"),
		"/foo?key=1337",
	);
	strictEqual(
		updateQueryStringParameter("/foo?pre=a&key=42&post=b", "key", "1337"),
		"/foo?pre=a&key=1337&post=b",
	);
	strictEqual(
		updateQueryStringParameter("/foo?pre=a&key=42&post=b", "bar", "1337"),
		"/foo?pre=a&key=42&post=b&bar=1337",
	);
	strictEqual(
		updateQueryStringParameter("/foo", "bar", "1337"),
		"/foo?bar=1337",
	);

	// test special regex chars in keys
	strictEqual(
		updateQueryStringParameter(
			"/foo?pre=a&key.asd=42&post=b",
			"key.asd",
			"1337$",
		),
		"/foo?pre=a&key.asd=1337$&post=b",
	);
	strictEqual(
		updateQueryStringParameter(
			"/foo?pre=a&key-asd=42&post=b",
			"key.asd",
			"1337$",
		),
		"/foo?pre=a&key-asd=42&post=b&key.asd=1337$",
	);
});
