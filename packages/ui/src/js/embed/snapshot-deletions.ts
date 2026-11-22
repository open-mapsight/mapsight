import isPlainObject from "lodash/isPlainObject";

const SNAPSHOT_KEY = "__mapsightSsrSnapshot";

function isRecord(value: unknown): value is Record<string, unknown> {
	return isPlainObject(value);
}

function isContainer(value: unknown): value is Record<string, unknown> {
	return Array.isArray(value) || isRecord(value);
}

function collectDeletedPaths(
	initial: unknown,
	current: unknown,
	parentPath: string[],
	paths: string[][],
) {
	if (
		initial === current ||
		!isContainer(initial) ||
		!isContainer(current) ||
		Array.isArray(initial) !== Array.isArray(current)
	) {
		return;
	}

	for (const key of Object.keys(initial)) {
		if (Object.hasOwn(current, key)) {
			collectDeletedPaths(
				initial[key],
				current[key],
				[...parentPath, key],
				paths,
			);
		} else if (!Array.isArray(current)) {
			paths.push([...parentPath, key]);
		}
	}
}

export function markServerSnapshot(
	serialized: unknown,
	initial: unknown,
	current: unknown,
) {
	if (!isRecord(serialized) || !isRecord(initial) || !isRecord(current)) {
		return serialized;
	}

	const deletedPaths: string[][] = [];
	// Compare live state before JSON and index compaction omit values. Start
	// within the server's registered slices to preserve client-only slices.
	for (const slice of Object.keys(current)) {
		if (Object.hasOwn(initial, slice)) {
			collectDeletedPaths(
				initial[slice],
				current[slice],
				[slice],
				deletedPaths,
			);
		}
	}
	return {...serialized, [SNAPSHOT_KEY]: {version: 1, deletedPaths}};
}

function isDeletionPath(value: unknown): value is string[] {
	return (
		Array.isArray(value) &&
		value.length >= 2 &&
		value.every((key: unknown) => typeof key === "string")
	);
}

export function extractSnapshotDeletions(state: Record<string, unknown>) {
	const marker = state[SNAPSHOT_KEY];
	if (
		!Object.hasOwn(state, SNAPSHOT_KEY) ||
		!isRecord(marker) ||
		marker.version !== 1 ||
		!Array.isArray(marker.deletedPaths)
	) {
		return [];
	}
	delete state[SNAPSHOT_KEY];
	return marker.deletedPaths.filter(isDeletionPath);
}

export function applySnapshotDeletions(state: unknown, paths: string[][]) {
	for (const path of paths) {
		const parent = path
			.slice(0, -1)
			.reduce<unknown>(
				(value, key) =>
					isContainer(value) && Object.hasOwn(value, key)
						? value[key]
						: undefined,
				state,
			);
		const key = path[path.length - 1];
		if (
			key !== undefined &&
			isRecord(parent) &&
			Object.hasOwn(parent, key)
		) {
			delete parent[key];
		}
	}
}
