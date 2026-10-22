import type {RootStyleDeclaration} from "../index";

export default function declarationToGeometry(
	declaration?: RootStyleDeclaration,
) {
	return declaration?.geometry?.value || null;
}

/** `extrusion-height` of a style group, in map units. */
export function declarationToExtrusionHeight(
	declaration?: RootStyleDeclaration,
): number | undefined {
	const value = declaration?.extrusion?.height?.value;
	return value == null ? undefined : Number(value);
}
