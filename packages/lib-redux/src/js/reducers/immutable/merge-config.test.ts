import merge from "lodash/merge";
import {describe, expect, it} from "vitest";

import createImmutablePathReducer from "../../create-immutable-path-reducer";
import mergeConfig from "./merge-config";

function update(state: unknown, value: unknown): unknown {
	return mergeConfig(state, {type: "merge-config", value});
}

describe("mergeConfig", () => {
	it("keeps loaded data and every unchanged config branch by reference", () => {
		const data = {features: [{id: "charging-1", properties: {free: 2}}]};
		const state = {
			charging: {
				type: "xhr-json",
				url: "/charging",
				filters: ["tags"],
				data,
			},
			other: {type: "local", data: null},
		};
		expect(
			update(state, {
				charging: {
					type: "xhr-json",
					url: "/charging",
					filters: ["tags"],
				},
			}),
		).toBe(state);

		const next = update(state, {
			charging: {filters: ["time"]},
		}) as typeof state;
		expect(next.charging).not.toBe(state.charging);
		expect(next.charging.filters).toEqual(["time"]);
		expect(next.charging.data).toBe(data);
		expect(next.other).toBe(state.other);
		expect(state.charging.filters).toEqual(["tags"]);
	});

	it("copies only the path to a real data edit", () => {
		const state = {
			data: {features: [{id: "a", properties: {free: 2}}, {id: "b"}]},
		};
		const next = update(state, {
			data: {features: [{properties: {free: 1}}]},
		}) as typeof state;
		expect(next.data.features[0]?.properties?.free).toBe(1);
		expect(next.data.features[1]).toBe(state.data.features[1]);
		expect(state.data.features[0]?.properties?.free).toBe(2);
	});

	it.each([
		{state: {values: [1, 2, 3]}, value: {values: [4]}},
		{state: {values: [1, 2]}, value: {values: []}},
		{state: {values: [1, 2]}, value: {values: [undefined, 3]}},
		{state: {value: 1}, value: {value: undefined, missing: undefined}},
		{state: {value: 1}, value: {value: null}},
		{state: {values: {a: 1}}, value: {values: [2]}},
		{state: {values: [1, 2]}, value: {values: {extra: true}}},
		{state: {values: [1, 2]}, value: {values: {0: 3}}},
		{state: [1], value: {length: 3}},
		{state: {values: Array(2)}, value: {values: [1]}},
		{state: undefined, value: {value: 2}},
		{state: null, value: {value: 2}},
		{state: 4, value: {value: 2}},
		{state: Object.create(null) as Record<string, unknown>, value: {}},
		{
			state: {
				value: Object.assign(
					Object.create(null) as Record<string, unknown>,
					{old: true},
				),
			},
			value: {value: {next: true}},
		},
		{state: {value: NaN}, value: {value: NaN}},
		{state: {value: new Date(0)}, value: {value: new Date(1)}},
		{state: {value: [1, 2]}, value: {value: new Uint8Array([3])}},
		{
			state: {value: {old: true}},
			value: {
				value: Object.assign(
					Object.create(null) as Record<string, unknown>,
					{next: true},
				),
			},
		},
	])("matches lodash merge for $state and $value", ({state, value}) => {
		const expected: unknown = merge(
			Array.isArray(state) ? [] : {},
			state,
			value,
		);
		expect(update(state, value)).toStrictEqual(expected);
	});

	it("retains lodash prototype pollution protections and inherited key behavior", () => {
		const value: unknown = JSON.parse(
			'{"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}}}',
		);
		expect(JSON.stringify(update({}, value))).toBe(
			JSON.stringify(merge({}, value)),
		);
		expect(Object.prototype).not.toHaveProperty("polluted");

		class Options {
			visible = true;
		}
		Options.prototype.visible = false;
		const inherited = Object.assign(
			Object.create({inherited: "value"}) as Record<string, unknown>,
			{own: true},
		);
		for (const config of [new Options(), inherited]) {
			expect(
				update({options: {old: true}}, {options: config}),
			).toStrictEqual(
				merge({}, {options: {old: true}}, {options: config}),
			);
		}
	});

	it("rejects cyclic plain config without mutating state", () => {
		const state = {options: {visible: true}};
		const value: {options?: unknown} = {};
		value.options = value;
		expect(() => update(state, value)).toThrow("cyclic Mapsight config");
		expect(state).toEqual({options: {visible: true}});
	});

	it("matches lodash on deterministic combinations of nested JSON values", () => {
		const values: unknown[] = [
			undefined,
			null,
			false,
			0,
			"text",
			[],
			[1, undefined, {x: 1}],
			{},
			{x: 1},
			{nested: {x: [1, 2]}},
		];
		for (const previous of values) {
			for (const incoming of values) {
				const state = {value: previous, untouched: {same: true}};
				const value = {value: incoming};
				expect(update(state, value)).toStrictEqual(
					merge({}, state, value),
				);
			}
		}
	});

	it("keeps path routing and no-op root identity", () => {
		const state = {
			sources: {charging: {url: "/charging"}},
			stable: {same: true},
		};
		const reducer = createImmutablePathReducer(mergeConfig);
		expect(
			reducer(state, {
				type: "merge-config",
				path: ["sources"],
				value: {charging: {url: "/charging"}},
			}),
		).toBe(state);
		const next = reducer(state, {
			type: "merge-config",
			path: ["sources"],
			value: {charging: {url: "/new"}},
		}) as typeof state;
		expect(next.sources.charging.url).toBe("/new");
		expect(next.stable).toBe(state.stable);
	});
});
