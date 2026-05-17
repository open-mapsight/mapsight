/**
 * Extracts specific paths from a source object and builds a new nested object.
 * Omits undefined values and empty path branches.
 */
function pickPaths(data: unknown, paths: string[][]): Record<string, unknown> {
	const result: Record<string, unknown> = {};

	for (const path of paths) {
		let val: unknown = data;
		for (const key of path) {
			val = val?.[key];
		}
		if (val === undefined) {
			continue;
		}

		let current = result;
		path.forEach((key, index) => {
			if (index === path.length - 1) {
				current[key] = val;
			} else {
				if (!current[key]) {
					current[key] = {};
				}
				current = current[key] as Record<string, unknown>;
			}
		});
	}

	return result;
}

export default pickPaths;
