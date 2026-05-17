import unique from "@mapsight/lib-js/array/unique";

export default function uniqueSerialized<T>(a: Array<T>): Array<T> {
	return unique(a.map((b) => JSON.stringify(b))).map(
		(b) => JSON.parse(b) as T,
	);
}
