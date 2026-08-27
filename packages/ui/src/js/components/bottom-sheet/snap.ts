/** Near-equality for “are we on this snap?” checks. */
export const SNAP_EPSILON_PX = 8;

/** Ascending pixel heights for sheet snap points. */
export type SnapHeights = number[];

export function nearestSnapHeight(height: number, snaps: SnapHeights): number {
	if (snaps.length === 0) {
		return height;
	}
	return snaps.reduce((best, snap) =>
		Math.abs(snap - height) < Math.abs(best - height) ? snap : best,
	);
}

export function snapIndexForHeight(height: number, snaps: SnapHeights): number {
	if (snaps.length === 0) {
		return 0;
	}
	let bestIndex = 0;
	for (let i = 1; i < snaps.length; i++) {
		if (
			Math.abs(snaps[i]! - height) < Math.abs(snaps[bestIndex]! - height)
		) {
			bestIndex = i;
		}
	}
	return bestIndex;
}

export function resolveSnapAfterDrag(
	rawHeight: number,
	startHeight: number,
	snaps: SnapHeights,
): number {
	if (snaps.length === 0) {
		return rawHeight;
	}

	const startIndex = snapIndexForHeight(startHeight, snaps);
	const delta = rawHeight - startHeight;

	if (delta > 0 && startIndex < snaps.length - 1) {
		const next = snaps[startIndex + 1]!;
		const mid = (snaps[startIndex]! + next) / 2;
		if (rawHeight >= mid) {
			return next;
		}
		return snaps[startIndex]!;
	}

	if (delta < 0 && startIndex > 0) {
		const prev = snaps[startIndex - 1]!;
		const mid = (prev + snaps[startIndex]!) / 2;
		if (rawHeight <= mid) {
			return prev;
		}
		return snaps[startIndex]!;
	}

	return nearestSnapHeight(rawHeight, snaps);
}

export function clampDragHeight(height: number, snaps: SnapHeights): number {
	if (snaps.length === 0) {
		return height;
	}
	const min = snaps[0]!;
	const max = snaps[snaps.length - 1]!;
	return Math.min(max, Math.max(min, height));
}

export function isAtOrAboveSnap(
	height: number,
	snap: number,
	epsilon = SNAP_EPSILON_PX,
): boolean {
	return height >= snap - epsilon;
}

/**
 * Default viewport-relative snaps (no host chrome assumed).
 * Hosts with a floating bottom bar should pass their own `snaps` instead.
 */
export function defaultViewportSnapHeights(
	viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800,
): SnapHeights {
	const max = Math.round(viewportHeight * 0.75);
	const medium = Math.round(viewportHeight * 0.5);
	const peek = Math.max(140, Math.min(240, medium - 48));
	const collapsed = Math.max(
		72,
		Math.min(peek - 48, Math.round(viewportHeight * 0.12)),
	);
	return [collapsed, peek, Math.min(medium, max - 48), max];
}
