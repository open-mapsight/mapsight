type ZipResult<A extends ReadonlyArray<ReadonlyArray<unknown>>> = Array<{
	[K in keyof A]: A[K][number];
}>;

/**
 * Throws if there is a length mismatch in the input arrays.
 *
 * @see https://lodash.com/docs#zip
 * @param arrays
 */
export function zip<A extends ReadonlyArray<ReadonlyArray<unknown>>>(
	...arrays: A
): ZipResult<A> {
	const lenEntries = arrays[0]?.length;

	if (lenEntries === undefined) {
		return [] as ZipResult<A>;
	}

	for (const array of arrays) {
		if (array.length !== lenEntries) {
			throw new Error(
				`array zip: An input array has an unexpected length. got: ${array.length}; expected: ${lenEntries}`,
			);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const result: Array<Array<unknown>> = new Array(lenEntries);

	for (let i = 0; i < lenEntries; i += 1) {
		const entry: Array<unknown> = new Array(arrays.length);

		for (let j = 0; j < arrays.length; j += 1) {
			entry[j] = arrays[j]![i]!;
		}

		result[i] = entry;
	}

	return result as ZipResult<A>;
}
