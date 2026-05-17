import {strictEqual, throws} from "assert";

import {describe, it} from "vitest";

import {
	assertNonNullable,
	createMapNonNullable,
	createUnwrapOr,
	ensureNonNullable,
	isNonNullable,
	mapNonNullable,
} from "./nonNullable.ts";

describe("isNonNullable", () => {
	it("normal", () => {
		strictEqual(isNonNullable(null), false);
		strictEqual(isNonNullable(undefined), false);
		strictEqual(isNonNullable(42), true);
		strictEqual(isNonNullable("asd"), true);
	});
});

describe("assertNonNullable", () => {
	it("normal", () => {
		throws(() => assertNonNullable(null));
		throws(() => assertNonNullable(undefined));
		assertNonNullable(42);
		assertNonNullable("asd");
	});
});

describe("ensureNonNullable", () => {
	it("normal", () => {
		throws(() => ensureNonNullable(null));
		throws(() => ensureNonNullable(undefined));
		strictEqual(ensureNonNullable(42), 42);
		strictEqual(ensureNonNullable("asd"), "asd");
	});
});

describe("createUnwrapOr", () => {
	it("normal", () => {
		const f = createUnwrapOr(7);
		strictEqual(f(2), 2);
		strictEqual(f(null), 7);
		strictEqual(f(undefined), 7);
	});

	it("undefined value", () => {
		const f = createUnwrapOr(undefined);
		strictEqual(f(2), 2);
		strictEqual(f(null), undefined);
		strictEqual(f(undefined), undefined);
	});
});

describe("mapNonNullable", () => {
	it("normal", () => {
		const res: undefined | number = mapNonNullable(21, (val) => {
			const _val: number = val;
			return 2 * val;
		});
		strictEqual(res, 42);
	});

	it("normal - null", () => {
		let called = false;
		const res: null | number = mapNonNullable(null, (val) => {
			const _val: never = val;
			called = true;
			return 42;
		});
		strictEqual(called, false);
		strictEqual(res, null);
	});

	it("normal - undefined", () => {
		let called = false;
		const res: undefined | number = mapNonNullable(undefined, (val) => {
			const _val: never = val;
			called = true;
			return 42;
		});
		strictEqual(called, false);
		strictEqual(res, undefined);
	});
});

describe("createMapNonNullable", () => {
	it("normal", () => {
		const f = createMapNonNullable((val: number) => {
			const _val: number = val;
			return 2 * val;
		});

		{
			const res: undefined | number = f(21);
			strictEqual(res, 42);
		}

		{
			const res: undefined | number = f(undefined);
			strictEqual(res, undefined);
		}

		{
			const res: null | number = f(null);
			strictEqual(res, null);
		}
	});
});
