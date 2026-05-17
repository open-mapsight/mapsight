/** Replaces the value if it's falsy. */
export default function ensureObject<T extends object, K extends keyof T>(
	parent: T,
	key: K,
	base: T[K],
): T[K] {
	if (parent === null || parent === undefined) {
		return base;
	}

	if (parent[key]) {
		return parent[key];
	}

	parent[key] = base;
	return base;
}
