import type {Coordinate} from "ol/coordinate";
import MultiPolygon from "ol/geom/MultiPolygon";
import Polygon from "ol/geom/Polygon";

export type ExtrusionPart = "roof" | "litWalls" | "shadedWalls";

type Ring = Array<Coordinate>;

type ExtrudedRings = {
	roof: Array<Ring>;
	litWalls: Array<Array<Ring>>;
	shadedWalls: Array<Array<Ring>>;
};

function signedArea(ring: Ring): number {
	let area = 0;
	for (let i = 0; i < ring.length - 1; i++) {
		const [x1, y1] = ring[i]!;
		const [x2, y2] = ring[i + 1]!;
		area += x1! * y2! - x2! * y1!;
	}
	return area / 2;
}

/**
 * Pseudo-3D block of one polygon (outer ring plus holes), seen slightly from
 * the south: the roof is the footprint moved north by `height` (map units).
 * The south-, east- and west-facing walls of the outer ring connect footprint
 * and roof; north-facing walls would be hidden by the roof. With light from
 * the north-west, west-facing walls are lit and the others shaded.
 */
export function extrudeRings(
	rings: Array<Ring>,
	height: number,
): ExtrudedRings {
	const lift = ([x, y]: Coordinate): Coordinate => [x!, y! + height];
	const outer = rings[0] ?? [];
	const clockwise = signedArea(outer) < 0;
	const litWalls: Array<Array<Ring>> = [];
	const shadedWalls: Array<Array<Ring>> = [];
	for (let i = 0; i < outer.length - 1; i++) {
		const a = outer[i]!;
		const b = outer[i + 1]!;
		const dx = b[0]! - a[0]!;
		const dy = b[1]! - a[1]!;
		const length = Math.hypot(dx, dy);
		if (!length) {
			continue;
		}
		// Outward normal: right of the edge for counter-clockwise rings.
		const nx = (clockwise ? -dy : dy) / length;
		const ny = (clockwise ? dx : -dx) / length;
		if (ny > 0) {
			continue;
		}
		const wall = [[a, b, lift(b), lift(a), a]];
		(ny - nx > 0 ? litWalls : shadedWalls).push(wall);
	}
	return {roof: rings.map((ring) => ring.map(lift)), litWalls, shadedWalls};
}

type ExtrudedGeometry = Record<ExtrusionPart, Polygon | MultiPolygon>;

// Derived geometries per source geometry, its revision and the height.
const cache = new WeakMap<
	Polygon | MultiPolygon,
	{revision: number; byHeight: Map<number, ExtrudedGeometry>}
>();

/**
 * Roof or walls of a (multi)polygon extruded by `height` map units (see
 * `extrudeRings`). The roof keeps the geometry type; walls are a
 * MultiPolygon.
 */
export default function extrudeGeometry(
	geometry: Polygon | MultiPolygon,
	height: number,
	part: ExtrusionPart,
): Polygon | MultiPolygon {
	const revision = geometry.getRevision();
	let entry = cache.get(geometry);
	if (!entry || entry.revision !== revision) {
		entry = {revision, byHeight: new Map()};
		cache.set(geometry, entry);
	}
	let parts = entry.byHeight.get(height);
	if (!parts) {
		const polygons =
			geometry instanceof Polygon
				? [geometry.getCoordinates()]
				: geometry.getCoordinates();
		const blocks = polygons.map((rings) => extrudeRings(rings, height));
		parts = {
			roof:
				geometry instanceof Polygon
					? new Polygon(blocks[0]!.roof)
					: new MultiPolygon(blocks.map((block) => block.roof)),
			litWalls: new MultiPolygon(
				blocks.flatMap((block) => block.litWalls),
			),
			shadedWalls: new MultiPolygon(
				blocks.flatMap((block) => block.shadedWalls),
			),
		};
		entry.byHeight.set(height, parts);
	}
	return parts[part];
}
