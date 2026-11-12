import {batchActions} from "redux-batched-actions";
import {describe, expect, it, vi} from "vitest";

import {createMapsightStore} from "@/index";
import {
	UNSET_ACTION_FLAG,
	async,
	controlled,
	quiet,
	removeKey,
	set,
	unset,
} from "@/lib/base/actions";
import {BaseController} from "@/lib/base/controller";
import type {FutureFlags} from "@/lib/base/future";
import {ACTION_REMOVE_KEY, ACTION_SET} from "@/lib/base/reducer";
import type {Action} from "@/types";

type Item = {a?: number; b?: number};
type Data = {
	obj: {x?: number; y?: number; nested?: {z?: number}};
	list: Array<Item | undefined>;
	flat: Array<number | undefined>;
	undef?: undefined;
	map: Map<string, number>;
	untouched: {kept: boolean};
};

const makeData = (): Data => ({
	obj: {x: 1, y: 2, nested: {z: 3}},
	list: [{a: 1, b: 2}, {a: 3}],
	flat: [10, 20, 30],
	undef: undefined,
	map: new Map([["k", 1]]),
	untouched: {kept: true},
});

const OFF: FutureFlags = {};
const MODES: Array<[string, FutureFlags | undefined]> = [
	["omitted", undefined],
	["empty", OFF],
	["false", {v15_unsetRemovesKey: false}],
];
const ON: FutureFlags = {v15_unsetRemovesKey: true};

function createStore(future?: FutureFlags, data: Data = makeData()) {
	return createMapsightStore(
		{data: new BaseController("data")},
		{},
		{data},
		null,
		future === undefined ? {} : {future},
	);
}
type TestStore = ReturnType<typeof createStore>;

const dataOf = (store: TestStore) => store.getState().data as Data;
const has = (value: object, key: string) =>
	Object.prototype.hasOwnProperty.call(value, key);

describe("unset action", () => {
	it("is a set(path, undefined) action with a marker, so wrappers keep it", () => {
		const path = ["data", "obj", "x"];
		const action = unset(path);

		expect(action).toEqual({
			type: ACTION_SET,
			value: undefined,
			meta: {path, [UNSET_ACTION_FLAG]: true},
		});
		expect(has(action, "value")).toBe(true);
		expect(set(path, undefined).meta).toEqual({path});
		expect(quiet(controlled(async(unset(path)))).meta).toMatchObject({
			path,
			[UNSET_ACTION_FLAG]: true,
		});
	});
});

describe.each(MODES)("unset without the future flag (%s)", (_name, future) => {
	it("keeps the key with an undefined value, like set(path, undefined)", () => {
		const store = createStore(future);
		const reference = createStore(future);
		const before = dataOf(store);

		store.dispatch(unset(["data", "obj", "x"]));
		reference.dispatch(set(["data", "obj", "x"], undefined));

		const after = dataOf(store);
		expect(has(after.obj, "x")).toBe(true);
		expect(after.obj.x).toBeUndefined();
		expect(after).toStrictEqual(dataOf(reference));
		expect(after).not.toBe(before);
		expect(after.obj).not.toBe(before.obj);
		expect(after.obj.nested).toBe(before.obj.nested);
		expect(after.list).toBe(before.list);
		expect(after.untouched).toBe(before.untouched);
	});

	it("sets an array element to undefined and keeps the length", () => {
		const store = createStore(future);
		const before = dataOf(store);

		store.dispatch(unset(["data", "flat", 1]));
		store.dispatch(unset(["data", "list", 0]));

		const after = dataOf(store);
		expect(after.flat).toStrictEqual([10, undefined, 30]);
		expect(after.list).toStrictEqual([undefined, {a: 3}]);
		expect(after.list[1]).toBe(before.list[1]);
	});

	it("keeps the state reference when there is nothing to unset", () => {
		const store = createStore(future);
		const state = store.getState();

		// key that does not exist, key with an undefined value
		store.dispatch(unset(["data", "obj", "missing"]));
		store.dispatch(unset(["data", "undef"]));
		// parents that do not exist, today set() does not create them either
		store.dispatch(unset(["data", "nothing", "here"]));
		store.dispatch(unset(["data", "obj", "x", "deeper"]));
		store.dispatch(unset(["data", "list", 5, "a"]));

		expect(store.getState()).toBe(state);
		expect(has(dataOf(store), "nothing")).toBe(false);
		expect(has(dataOf(store), "undef")).toBe(true);
	});

	it("unsets keys inside array elements", () => {
		const store = createStore(future);
		const before = dataOf(store);

		store.dispatch(unset(["data", "list", 0, "a"]));

		const after = dataOf(store);
		expect(Array.isArray(after.list)).toBe(true);
		expect(has(after.list[0] ?? {}, "a")).toBe(true);
		expect(after.list[0]).toStrictEqual({a: undefined, b: 2});
		expect(after.list[1]).toBe(before.list[1]);
	});

	it("keeps unsetting a key of a non-plain object parent a no-op", () => {
		const store = createStore(future);
		const state = store.getState();

		store.dispatch(unset(["data", "map", "k"]));

		expect(store.getState()).toBe(state);
		expect(dataOf(store).map.get("k")).toBe(1);
	});

	it("has the same effect inside a batch and wrapped in controlled()", () => {
		const store = createStore(future);
		const reference = createStore(future);

		store.dispatch(
			controlled(
				batchActions([
					unset(["data", "obj", "x"]),
					unset(["data", "flat", 0]),
					set(["data", "obj", "y"], 5),
				]),
			),
		);
		reference.dispatch(
			batchActions([
				set(["data", "obj", "x"], undefined),
				set(["data", "flat", 0], undefined),
				set(["data", "obj", "y"], 5),
			]),
		);

		expect(dataOf(store)).toStrictEqual(dataOf(reference));
		expect(has(dataOf(store).obj, "x")).toBe(true);
	});
});

describe("unset with the future flag", () => {
	it("deletes the key of a plain object parent, like removeKey", () => {
		const store = createStore(ON);
		const reference = createStore(ON);
		const before = dataOf(store);

		store.dispatch(unset(["data", "obj", "x"]));
		reference.dispatch(removeKey(["data", "obj", "x"]));

		const after = dataOf(store);
		expect(has(after.obj, "x")).toBe(false);
		expect(after.obj).toStrictEqual({y: 2, nested: {z: 3}});
		expect(after).toStrictEqual(dataOf(reference));
		expect(after).not.toBe(before);
		expect(after.obj).not.toBe(before.obj);
		expect(after.obj.nested).toBe(before.obj.nested);
		expect(after.list).toBe(before.list);
		expect(after.untouched).toBe(before.untouched);
		expect(has(before.obj, "x")).toBe(true);
	});

	it("deletes nested keys and top-level keys of the controller state", () => {
		const store = createStore(ON);
		const before = dataOf(store);

		store.dispatch(unset(["data", "obj", "nested", "z"]));
		store.dispatch(unset(["data", "untouched"]));
		store.dispatch(unset(["data", "undef"]));

		const after = dataOf(store);
		expect(after.obj.nested).toStrictEqual({});
		expect(has(after, "untouched")).toBe(false);
		expect(has(after, "undef")).toBe(false);
		expect(after.obj.y).toBe(2);
		expect(after.list).toBe(before.list);
		expect(after.flat).toBe(before.flat);
	});

	it("deletes keys inside array elements and keeps the array", () => {
		const store = createStore(ON);
		const before = dataOf(store);

		store.dispatch(unset(["data", "list", 0, "a"]));

		const after = dataOf(store);
		expect(Array.isArray(after.list)).toBe(true);
		expect(after.list).toStrictEqual([{b: 2}, {a: 3}]);
		expect(has(after.list[0] ?? {}, "a")).toBe(false);
		expect(after.list[1]).toBe(before.list[1]);
	});

	it("still sets array elements to undefined and does not shorten arrays", () => {
		const store = createStore(ON);
		const reference = createStore(OFF);
		const before = dataOf(store);

		for (const target of [store, reference]) {
			target.dispatch(unset(["data", "flat", 1]));
			target.dispatch(unset(["data", "list", 0]));
			target.dispatch(unset(["data", "flat", 2]));
		}

		const after = dataOf(store);
		expect(after.flat).toStrictEqual([10, undefined, undefined]);
		expect(after.flat).toHaveLength(3);
		expect(after.list).toStrictEqual([undefined, {a: 3}]);
		expect(after.list[1]).toBe(before.list[1]);
		expect(after).toStrictEqual(dataOf(reference));
	});

	it("does nothing and keeps the state reference when the parent or key is missing", () => {
		const store = createStore(ON);
		const state = store.getState();

		store.dispatch(unset(["data", "obj", "missing"]));
		store.dispatch(unset(["data", "nothing", "here"]));
		store.dispatch(unset(["data", "obj", "x", "deeper"]));
		store.dispatch(unset(["data", "list", 5, "a"]));
		store.dispatch(unset(["data", "list", 5]));

		expect(store.getState()).toBe(state);
		expect(has(dataOf(store), "nothing")).toBe(false);
	});

	it("leaves a non-plain object parent alone", () => {
		const store = createStore(ON);
		const state = store.getState();

		store.dispatch(unset(["data", "map", "k"]));

		expect(store.getState()).toBe(state);
	});

	it("treats a plain set(path, undefined) as before", () => {
		const store = createStore(ON);
		const before = dataOf(store);

		store.dispatch(set(["data", "obj", "x"], undefined));
		store.dispatch(set(["data", "flat", 0], undefined));

		const after = dataOf(store);
		expect(has(after.obj, "x")).toBe(true);
		expect(after.obj.x).toBeUndefined();
		expect(after.flat[0]).toBeUndefined();
		expect(after.list).toBe(before.list);
	});

	it("does not touch the dispatched action", () => {
		const store = createStore(ON);
		const action = unset(["data", "obj", "x"]);
		const snapshot = structuredClone(action);

		expect(store.dispatch(action)).toBe(action);

		expect(action).toStrictEqual(snapshot);
		expect(action.type).toBe(ACTION_SET);
		expect(has(action, "value")).toBe(true);
	});

	it("applies to every action of a batch, mixed with plain sets", () => {
		const store = createStore(ON);
		const before = dataOf(store);

		store.dispatch(
			batchActions([
				unset(["data", "obj", "x"]),
				set(["data", "obj", "y"], undefined),
				unset(["data", "flat", 0]),
				set(["data", "untouched", "kept"], false),
				batchActions([unset(["data", "list", 0, "a"])]),
			]),
		);

		const after = dataOf(store);
		expect(has(after.obj, "x")).toBe(false);
		expect(has(after.obj, "y")).toBe(true);
		expect(after.obj.y).toBeUndefined();
		expect(after.flat).toStrictEqual([undefined, 20, 30]);
		expect(after.untouched).toStrictEqual({kept: false});
		expect(after.list).toStrictEqual([{b: 2}, {a: 3}]);
		expect(after.list[1]).toBe(before.list[1]);
	});

	it("applies inside controlled() and quiet() wrapped actions", () => {
		const store = createStore(ON);

		store.dispatch(controlled(unset(["data", "obj", "x"])));
		store.dispatch(quiet(unset(["data", "obj", "y"])));
		expect(dataOf(store).obj).toStrictEqual({nested: {z: 3}});

		store.dispatch(
			controlled(
				batchActions([
					unset(["data", "flat", 0]),
					unset(["data", "list", 0, "b"]),
					unset(["data", "untouched"]),
				]),
			),
		);
		const after = dataOf(store);
		expect(after.flat).toStrictEqual([undefined, 20, 30]);
		expect(after.list).toStrictEqual([{a: 1}, {a: 3}]);
		expect(has(after, "untouched")).toBe(false);
	});

	it("applies to async() actions that are dispatched later", async () => {
		vi.useFakeTimers();
		try {
			const store = createStore(ON);

			store.dispatch(async(unset(["data", "obj", "x"])));
			store.dispatch(
				async(
					batchActions([
						unset(["data", "obj", "y"]),
						controlled(unset(["data", "flat", 0])),
					]),
				),
			);
			expect(has(dataOf(store).obj, "x")).toBe(true);

			await vi.runAllTimersAsync();

			expect(dataOf(store).obj).toStrictEqual({nested: {z: 3}});
			expect(dataOf(store).flat).toStrictEqual([undefined, 20, 30]);
		} finally {
			vi.useRealTimers();
		}
	});

	it("keeps the controlled flag: uncontrolled observers do not see a controlled unset", () => {
		const store = createStore(ON);
		const listener = vi.fn();
		store.subscribeUncontrolled(listener);

		store.dispatch(controlled(unset(["data", "obj", "x"])));
		expect(listener).not.toHaveBeenCalled();
		expect(has(dataOf(store).obj, "x")).toBe(false);

		store.dispatch(unset(["data", "obj", "y"]));
		expect(listener).toHaveBeenCalledTimes(1);
		expect(has(dataOf(store).obj, "y")).toBe(false);
	});

	it("hands the resolved removeKey action to the controller reducers only", () => {
		const typesFor = (future: FutureFlags) => {
			const controller = new BaseController("data");
			const controllerTypes: string[] = [];
			controller.registerReducer((state, action) => {
				controllerTypes.push(action.type);
				return state;
			});
			const appTypes: string[] = [];
			const store = createMapsightStore(
				{data: controller},
				{
					app: (state: unknown = {}, action: Action) => {
						appTypes.push(action.type);
						return state;
					},
				},
				{data: makeData()},
				null,
				{future},
			);
			controllerTypes.length = 0;
			appTypes.length = 0;

			store.dispatch(unset(["data", "obj", "x"]));

			return {controllerTypes, appTypes};
		};

		expect(typesFor(ON)).toEqual({
			controllerTypes: [ACTION_REMOVE_KEY],
			appTypes: [ACTION_SET],
		});
		expect(typesFor(OFF)).toEqual({
			controllerTypes: [ACTION_SET],
			appTypes: [ACTION_SET],
		});
	});
});

describe.each([
	["without", OFF],
	["with", ON],
])("unset of a whole controller state %s the future flag", (_name, future) => {
	it("is rejected by the store like a set to undefined", () => {
		const store = createStore(future);

		expect(() => store.dispatch(unset(["data"]))).toThrow(
			"returned undefined",
		);
		expect(() => store.dispatch(set(["data"], undefined))).toThrow(
			"returned undefined",
		);
	});
});

describe("future flag per store", () => {
	it("lets stores with different settings work side by side", () => {
		const off = createStore(OFF);
		const on = createStore(ON);
		const other = createStore();
		const action = unset(["data", "obj", "x"]);

		on.dispatch(action);
		off.dispatch(action);
		other.dispatch(action);
		on.dispatch(unset(["data", "obj", "y"]));
		off.dispatch(unset(["data", "obj", "y"]));

		expect(has(dataOf(on).obj, "x")).toBe(false);
		expect(has(dataOf(on).obj, "y")).toBe(false);
		expect(has(dataOf(off).obj, "x")).toBe(true);
		expect(has(dataOf(off).obj, "y")).toBe(true);
		expect(has(dataOf(other).obj, "x")).toBe(true);
	});

	it("only reads the flag value true", () => {
		const store = createStore({
			v15_unsetRemovesKey: "yes" as unknown as boolean,
		});

		store.dispatch(unset(["data", "obj", "x"]));

		expect(has(dataOf(store).obj, "x")).toBe(true);
	});

	it("routes by controller key: unset only reaches the addressed controller", () => {
		const store = createMapsightStore(
			{
				first: new BaseController("first"),
				second: new BaseController("second"),
			},
			{},
			{first: {a: 1, b: 2}, second: {a: 1, b: 2}},
			null,
			{future: ON},
		);
		const second = store.getState().second;

		store.dispatch(unset(["first", "a"]));

		expect(store.getState().first).toStrictEqual({b: 2});
		expect(store.getState().second).toBe(second);
	});
});
