import {LRUCache} from "lru-cache";

import {resolveMapsightIconSpec} from "../icon/icon-id.ts";
import type {IconVariant} from "../icon/icon-id.ts";
import {renderIconBitmap} from "../icon/render.ts";
import {mapsightIconCacheKey} from "./icon-key.ts";

export type IconBitmap = {
	dataUrl: string;
	width: number;
	height: number;
	logicalWidth: number;
	logicalHeight: number;
	pixelRatio: number;
	key: string;
};

export type IconCacheOptions = {
	max?: number;
};

export type IconCacheStats = {
	size: number;
	hits: number;
	misses: number;
	inFlight: number;
};

export class IconCache {
	#cache: LRUCache<string, IconBitmap>;
	#pending = new Map<string, Promise<IconBitmap>>();
	#hits = 0;
	#misses = 0;

	constructor(options: IconCacheOptions = {}) {
		this.#cache = new LRUCache<string, IconBitmap>({
			max: options.max ?? 512,
		});
	}

	getStats(): IconCacheStats {
		return {
			size: this.#cache.size,
			hits: this.#hits,
			misses: this.#misses,
			inFlight: this.#pending.size,
		};
	}

	clear(): void {
		this.#cache.clear();
		this.#pending.clear();
	}

	has(mapsightIconId: string, variant?: IconVariant): boolean {
		return this.#cache.has(mapsightIconCacheKey(mapsightIconId, variant));
	}

	getCached(
		mapsightIconId: string,
		variant?: IconVariant,
	): IconBitmap | undefined {
		return this.#cache.get(mapsightIconCacheKey(mapsightIconId, variant));
	}

	async get(
		mapsightIconId: string,
		variant?: IconVariant,
	): Promise<IconBitmap | null> {
		const key = mapsightIconCacheKey(mapsightIconId, variant);
		const spec = resolveMapsightIconSpec(mapsightIconId, variant);
		if (!spec) {
			return null;
		}

		const cached = this.#cache.get(key);
		if (cached) {
			this.#hits += 1;
			return cached;
		}

		const pending = this.#pending.get(key);
		if (pending) {
			return pending;
		}

		this.#misses += 1;
		const promise = this.#generate(spec, key);
		this.#pending.set(key, promise);

		try {
			const bitmap = await promise;
			this.#cache.set(key, bitmap);
			return bitmap;
		} finally {
			this.#pending.delete(key);
		}
	}

	async #generate(
		spec: NonNullable<ReturnType<typeof resolveMapsightIconSpec>>,
		key: string,
	): Promise<IconBitmap> {
		const rendered = await renderIconBitmap(spec);
		return {...rendered, key};
	}
}

export const defaultIconCache = new IconCache();
