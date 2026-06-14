import {describe, expect, it} from "vitest";

import deepExtend from "./deep-extend.ts";

describe("deepExtend", () => {
	it("merges nested records", () => {
		const target: Record<string, unknown> = {
			nested: {
				a: 1,
			},
		};

		const result = deepExtend(target, {
			nested: {
				b: 2,
			},
		});

		expect(result).toBe(target);
		expect(result).toEqual({
			nested: {
				a: 1,
				b: 2,
			},
		});
	});

	it("does not merge prototype-polluting keys", () => {
		const source = JSON.parse(
			'{"__proto__":{"polluted":true},"safe":{"constructor":{"prototype":{"polluted":true}},"prototype":{"polluted":true},"value":1}}',
		) as Record<string, unknown>;

		const result = deepExtend({safe: {}}, source);

		expect(result).toEqual({
			safe: {
				value: 1,
			},
		});
		expect({}).not.toHaveProperty("polluted");
	});

	it("handles null and undefined sources without changing target", () => {
		const target: Record<string, unknown> = {
			nested: {
				a: 1,
			},
		};

		const result = deepExtend(target, undefined, null);

		expect(result).toBe(target);
		expect(result).toEqual({
			nested: {
				a: 1,
			},
		});
	});

	it("overwrites primitive values with objects and objects with primitives", () => {
		const target: Record<string, unknown> = {
			value: 1,
			nested: {
				a: 1,
			},
		};

		const result = deepExtend(target, {
			value: {
				b: 2,
			},
			nested: 3,
		});

		expect(result).toBe(target);
		expect(result).toEqual({
			value: {
				b: 2,
			},
			nested: 3,
		});
	});

	it("overwrites arrays in nested structures", () => {
		const target: Record<string, unknown> = {
			list: [1, 2],
			nested: {
				list: [3],
			},
		};

		const result = deepExtend(target, {
			list: [4, 5],
			nested: {
				list: [6, 7],
			},
		});

		expect(result).toBe(target);
		expect(result).toEqual({
			list: [4, 5],
			nested: {
				list: [6, 7],
			},
		});
	});

	it("merges deeply nested records beyond one level", () => {
		const target: Record<string, unknown> = {
			level1: {
				level2: {
					a: 1,
				},
			},
		};

		const result = deepExtend(target, {
			level1: {
				level2: {
					b: 2,
				},
			},
		});

		expect(result).toBe(target);
		expect(result).toEqual({
			level1: {
				level2: {
					a: 1,
					b: 2,
				},
			},
		});
	});
});
