import {isRecord} from "../object.ts";

type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

const PROTOTYPE_POLLUTION_KEYS = new Set([
	"__proto__",
	"constructor",
	"prototype",
]);

export default function deepExtend<T extends Record<string, unknown>>(
	target: T,
	...sources: Array<DeepPartial<T> | null | undefined>
): T {
	for (const source of sources) {
		if (!source) {
			continue;
		}

		for (const key in source) {
			if (
				Object.prototype.hasOwnProperty.call(source, key) &&
				!PROTOTYPE_POLLUTION_KEYS.has(key)
			) {
				const sourceValue = source[key as keyof typeof source];
				const targetValue = target[key as keyof T];

				if (
					sourceValue &&
					isRecord(sourceValue) &&
					isRecord(targetValue)
				) {
					target[key as keyof T] = deepExtend(
						targetValue,
						sourceValue,
					);
				} else {
					// Non-objects overwrite (exact original behavior)
					target[key as keyof T] = sourceValue as T[keyof T];
				}
			}
		}
	}

	return target;
}
