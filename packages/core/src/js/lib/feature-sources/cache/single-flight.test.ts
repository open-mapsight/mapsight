import {describe, expect, it} from "vitest";

import {createMemoryFeatureSourceCache} from "./memory-cache";
import {singleFlightIfShareable} from "./single-flight";

describe("singleFlightIfShareable", () => {
	it("shares a shareable result with waiters", async () => {
		const cache = createMemoryFeatureSourceCache();
		let resolveLoad!: (value: {value: string; share: boolean}) => void;
		let loads = 0;
		const first = singleFlightIfShareable(cache, "k", () => {
			loads += 1;
			return new Promise<{value: string; share: boolean}>((resolve) => {
				resolveLoad = resolve;
			});
		});
		const second = singleFlightIfShareable(cache, "k", () => {
			loads += 1;
			return Promise.resolve({value: "waiter", share: true});
		});
		resolveLoad({value: "leader", share: true});
		await expect(Promise.all([first, second])).resolves.toEqual([
			"leader",
			"leader",
		]);
		expect(loads).toBe(1);
	});

	it("does not give waiters an unshareable result", async () => {
		const cache = createMemoryFeatureSourceCache();
		let resolveLoad!: (value: {value: string; share: boolean}) => void;
		let loads = 0;
		const first = singleFlightIfShareable(cache, "k", () => {
			loads += 1;
			return new Promise<{value: string; share: boolean}>((resolve) => {
				resolveLoad = resolve;
			});
		});
		const second = singleFlightIfShareable(cache, "k", () => {
			loads += 1;
			return Promise.resolve({value: "waiter-own", share: false});
		});
		resolveLoad({value: "leader-private", share: false});
		await expect(first).resolves.toBe("leader-private");
		await expect(second).resolves.toBe("waiter-own");
		expect(loads).toBe(2);
	});

	it("does not join flights that use a different shared policy", async () => {
		const cache = createMemoryFeatureSourceCache();
		let resolvePrivate!: (value: {value: string; share: boolean}) => void;
		let loads = 0;
		const privateFlight = singleFlightIfShareable(
			cache,
			"k",
			() => {
				loads += 1;
				return new Promise<{value: string; share: boolean}>(
					(resolve) => {
						resolvePrivate = resolve;
					},
				);
			},
			false,
		);
		const sharedFlight = singleFlightIfShareable(
			cache,
			"k",
			() => {
				loads += 1;
				return Promise.resolve({value: "shared-own", share: false});
			},
			true,
		);
		resolvePrivate({value: "private-body", share: true});
		await expect(privateFlight).resolves.toBe("private-body");
		await expect(sharedFlight).resolves.toBe("shared-own");
		expect(loads).toBe(2);
	});

	it("joins flights that resolve to the same TTL policy", async () => {
		const cache = createMemoryFeatureSourceCache();
		let resolveLoad!: (value: {value: string; share: boolean}) => void;
		let loads = 0;
		const first = singleFlightIfShareable(
			cache,
			"k",
			() => {
				loads += 1;
				return new Promise<{value: string; share: boolean}>(
					(resolve) => {
						resolveLoad = resolve;
					},
				);
			},
			false,
		);
		const second = singleFlightIfShareable(
			cache,
			"k",
			() => {
				loads += 1;
				return Promise.resolve({value: "waiter", share: true});
			},
			false,
			{minMs: 10_000},
		);
		resolveLoad({value: "leader", share: true});
		await expect(Promise.all([first, second])).resolves.toEqual([
			"leader",
			"leader",
		]);
		expect(loads).toBe(1);
	});

	it("does not join flights that use a different TTL policy", async () => {
		const cache = createMemoryFeatureSourceCache();
		let resolveLoose!: (value: {value: string; share: boolean}) => void;
		let loads = 0;
		const loose = singleFlightIfShareable(
			cache,
			"k",
			() => {
				loads += 1;
				return new Promise<{value: string; share: boolean}>(
					(resolve) => {
						resolveLoose = resolve;
					},
				);
			},
			false,
			{minMs: 10_000},
		);
		const strict = singleFlightIfShareable(
			cache,
			"k",
			() => {
				loads += 1;
				return Promise.resolve({value: "strict-own", share: true});
			},
			false,
			{minMs: 60_000},
		);
		resolveLoose({value: "loose-body", share: true});
		await expect(loose).resolves.toBe("loose-body");
		await expect(strict).resolves.toBe("strict-own");
		expect(loads).toBe(2);
	});
});
