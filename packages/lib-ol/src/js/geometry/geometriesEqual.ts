import GeometryCollection from "ol/geom/GeometryCollection";
import SimpleGeometry from "ol/geom/SimpleGeometry";

/**
 * Value equality for OpenLayers geometries: type, layout, and flat
 * coordinates. GeometryCollection is compared recursively.
 *
 * Used when a poll reread allocates a new Geometry with the same coordinates
 * so callers can skip `set("geometry")`.
 */
export default function geometriesEqual(
	left: unknown,
	right: unknown,
): boolean {
	if (left === right) {
		return true;
	}

	if (
		left instanceof GeometryCollection &&
		right instanceof GeometryCollection
	) {
		const leftParts = left.getGeometriesArray();
		const rightParts = right.getGeometriesArray();
		return (
			leftParts.length === rightParts.length &&
			leftParts.every((part, index) =>
				geometriesEqual(part, rightParts[index]),
			)
		);
	}

	if (
		!(left instanceof SimpleGeometry) ||
		!(right instanceof SimpleGeometry)
	) {
		return false;
	}

	if (
		left.getType() !== right.getType() ||
		left.getLayout() !== right.getLayout()
	) {
		return false;
	}

	const leftCoordinates = left.getFlatCoordinates();
	const rightCoordinates = right.getFlatCoordinates();
	if (leftCoordinates.length !== rightCoordinates.length) {
		return false;
	}

	for (let i = 0; i < leftCoordinates.length; i += 1) {
		if (leftCoordinates[i] !== rightCoordinates[i]) {
			return false;
		}
	}

	return true;
}
