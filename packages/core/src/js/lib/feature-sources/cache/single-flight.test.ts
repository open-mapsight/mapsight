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
});
