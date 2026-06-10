import {useEffect, useState} from "react";

import {
	type IconBitmap,
	type IconCache,
	type IconSpec,
	defaultIconCache,
	hashSpec,
} from "@mapsight/traffic-style/runtime";

export function useMapsightIcon(
	spec: IconSpec,
	cache: IconCache = defaultIconCache,
): {
	src: string | null;
	bitmap: IconBitmap | null;
	loading: boolean;
	error: Error | null;
} {
	const key = hashSpec(spec);
	const [bitmap, setBitmap] = useState<IconBitmap | null>(
		() => cache.getCached(spec) ?? null,
	);
	const [loading, setLoading] = useState(() => cache.getCached(spec) == null);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		let cancelled = false;
		const cached = cache.getCached(spec);
		if (cached) {
			setBitmap(cached);
			setLoading(false);
			setError(null);
			return;
		}

		setBitmap(null);
		setLoading(true);
		setError(null);

		void cache
			.get(spec)
			.then((result) => {
				if (!cancelled) {
					setBitmap(result);
					setLoading(false);
				}
			})
			.catch((cause: unknown) => {
				if (!cancelled) {
					setError(
						cause instanceof Error
							? cause
							: new Error(String(cause)),
					);
					setLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
		// `key` is derived from spec content; do not depend on `spec` object identity.
	}, [cache, key]);

	return {
		src: bitmap?.dataUrl ?? null,
		bitmap,
		loading,
		error,
	};
}
