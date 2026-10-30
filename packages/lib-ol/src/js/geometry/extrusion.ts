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
 * South-facing walls of outer and inner rings connect footprint and roof;
 * north-facing walls are hidden and north-south edges have no visible area.
 * With light from the north-west, walls are split into lit and shaded faces.
 */
export function extrudeRings(
	rings: Array<Ring>,
	height: number,
): ExtrudedRings {
	const lift = ([x, y]: Coordinate): Coordinate => [x!, y! + height];
	const litWalls: Array<Array<Ring>> = [];
	const shadedWalls: Array<Array<Ring>> = [];
	for (const [ringIndex, ring] of rings.entries()) {
		// Normals point away from the filled area, into holes for inner rings.
		const clockwise = signedArea(ring) < 0;
		const flip = clockwise !== ringIndex > 0;
		for (let i = 0; i < ring.length - 1; i++) {
			const a = ring[i]!;
			const b = ring[i + 1]!;
			const dx = b[0]! - a[0]!;
			const dy = b[1]! - a[1]!;
			const length = Math.hypot(dx, dy);
			if (!length) {
				continue;
			}
			const nx = (flip ? -dy : dy) / length;
			const ny = (flip ? dx : -dx) / length;
			if (ny >= 0) {
				continue;
			}
			const wall = [[a, b, lift(b), lift(a), a]];
			(ny - nx > 0 ? litWalls : shadedWalls).push(wall);
		}
	}
	return {roof: rings.map((ring) => ring.map(lift)), litWalls, shadedWalls};
}

type ExtrudedGeometry = Record<ExtrusionPart, Polygon | MultiPolygon>;

// Keep a few style-group heights without retaining every animated/zoom height.
const MAX_CACHED_HEIGHTS = 8;

// Derived geometries per source geometry, its revision and recent heights.
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
	}
	// Refresh insertion order so eviction removes the least recently used height.
	entry.byHeight.delete(height);
	entry.byHeight.set(height, parts);
	if (entry.byHeight.size > MAX_CACHED_HEIGHTS) {
		entry.byHeight.delete(entry.byHeight.keys().next().value!);
	}
	return parts[part];
}
