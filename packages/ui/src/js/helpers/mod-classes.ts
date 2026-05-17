import {unreachableValue} from "@mapsight/lib-js/unreachable";

/**
 * @param name Name of block or element
 * @param mods modifiers
 * @returns class string
 */
export default function modClasses(
	name: string,
	mods:
		| Record<string, boolean>
		| Array<string | false | null | undefined>
		| string
		| false
		| null
		| undefined,
): string {
	const modsArr = (() => {
		// string to array
		if (typeof mods === "string") {
			return [mods];
		}

		// object to array
		if (mods !== null && typeof mods === "object" && !Array.isArray(mods)) {
			return Object.entries(mods)
				.filter(([_, val]) => val === true)
				.map(([key, _]) => key);
		}

		if (Array.isArray(mods)) {
			return mods.filter(isNotFalsy);
		}

		if (mods === null || mods === false || mods === undefined) {
			return [];
		}

		unreachableValue(mods);
	})();

	return [name, ...modsArr.map((mod) => `${name}--${mod}`)].join(" ");
}

function isNotFalsy<T>(val: T | false | null | undefined): val is T {
	return val !== false && val !== null && val !== undefined;
}
