import {useEffect, useState} from "react";

import {
	type IconBitmap,
	type IconVariant,
	getCachedIcon,
	loadIcon,
	mapsightIconCacheKey,
} from "@mapsight/traffic-style/runtime";

export function useMapsightIcon(
	mapsightIconId: string,
	variant?: IconVariant,
): {
	src: string | null;
	bitmap: IconBitmap | null;
	loading: boolean;
	error: Error | null;
} {
	const key = mapsightIconCacheKey(mapsightIconId, variant);
	const [bitmap, setBitmap] = useState<IconBitmap | null>(
		() => getCachedIcon(mapsightIconId, variant) ?? null,
	);
	const [loading, setLoading] = useState(
		() => getCachedIcon(mapsightIconId, variant) == null,
	);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		let cancelled = false;
		const cached = getCachedIcon(mapsightIconId, variant);
		if (cached) {
			setBitmap(cached);
			setLoading(false);
			setError(null);
			return;
		}

		setBitmap(null);
		setLoading(true);
		setError(null);

		if (!key) {
			setLoading(false);
			return;
		}

		void loadIcon(mapsightIconId, variant)
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
	}, [key, mapsightIconId, variant]);

	return {
		src: bitmap?.dataUrl ?? null,
		bitmap,
		loading,
		error,
	};
}
