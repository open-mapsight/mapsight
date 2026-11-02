import Icon from "ol/style/Icon.js";

import {defaultIconCache} from "@mapsight/traffic-style/runtime-dev";

/** Benchmark-only policy prototype; does not install speculative work in production. */
export type PreloadPlan = {
	leadMs: number;
	concurrency: number;
	maxTargets: number;
	budgetMs: number;
	forecast: "correct" | "wrong";
	mapImage: boolean;
	cancelAfterMs?: number;
};

export function prepareIcons(
	ids: string[],
	plan: PreloadPlan,
	srcFor: (id: string) => string | Promise<string>,
) {
	const targets = [...new Set(ids)].slice(0, plan.maxTargets);
	const startedAt = performance.now();
	const started: string[] = [];
	const completed: string[] = [];
	let next = 0;
	let active = 0;
	let peakActive = 0;
	let stopped = false;
	const stop = () => {
		stopped = true;
	};
	const cancelled =
		plan.cancelAfterMs === undefined
			? undefined
			: setTimeout(stop, plan.cancelAfterMs);
	async function worker() {
		while (!stopped && performance.now() - startedAt < plan.budgetMs) {
			const id = targets[next++];
			if (id === undefined) return;
			started.push(id);
			active++;
			peakActive = Math.max(peakActive, active);
			try {
				const src = await srcFor(id);
				if (plan.mapImage) await prepareMapImage(src);
				completed.push(id);
			} finally {
				active--;
			}
		}
	}
	const settled = Promise.all(
		Array.from({length: plan.concurrency}, worker),
	).finally(() => {
		if (cancelled !== undefined) clearTimeout(cancelled);
	});
	return {
		startedAt,
		stop,
		settled,
		started,
		completed,
		get peakActive() {
			return peakActive;
		},
	};
}

export async function prepareRuntimeIcon(id: string): Promise<string> {
	const bitmap = await defaultIconCache.get(id, "default");
	if (!bitmap) throw new Error(`Cannot prepare icon: ${id}`);
	return bitmap.dataUrl;
}

/** Also primes OL's image cache, not only Mapsight's raster cache. */
async function prepareMapImage(src: string): Promise<void> {
	const image = new Icon({src, scale: 0.5});
	if (image.getImageState() === 2) return;
	await new Promise<void>((resolve, reject) => {
		const changed = () => {
			const state: unknown = image.getImageState();
			if (state !== 2 && state !== 3) return;
			image.unlistenImageChange(changed);
			if (state === 2) resolve();
			else reject(new Error("Icon preloading failed"));
		};
		image.listenImageChange(changed);
		image.load();
		changed();
	});
}
