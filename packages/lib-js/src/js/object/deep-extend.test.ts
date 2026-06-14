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
});
