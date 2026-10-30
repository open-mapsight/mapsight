import type {Type as GeometryType} from "ol/geom/Geometry";
import type Geometry from "ol/geom/Geometry";
import LineString from "ol/geom/LineString";
import MultiPolygon from "ol/geom/MultiPolygon";
import Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";

import type {INTERMEDIATE_FILTER, RING_FILTER, VERTICES_FILTER} from "../index";
import extrudeGeometry, {type ExtrusionPart} from "./extrusion";
import getLSSegmentVertices from "./getLineStringSegmentVerticesWithRotation";
import getPolygonSegmentVertices from "./getPolygonRingSegmentVerticesWithRotation";

export type GeometryWithMeta = [Geometry, {rotation?: number}];

const deriveLSVertexGeometries = (
	b: LineString,
	v?: VERTICES_FILTER,
	i?: INTERMEDIATE_FILTER,
) =>
	getLSSegmentVertices(b, v, i).map(([c, r]): GeometryWithMeta => [
		new Point(c),
		{rotation: r},
	]);
const derivePolygonVertexGeometries = (
	b: Polygon,
	v?: VERTICES_FILTER,
	i?: INTERMEDIATE_FILTER,
	j?: RING_FILTER,
) =>
	getPolygonSegmentVertices(b, v, i, j).map(([c, r]): GeometryWithMeta => [
		new Point(c),
		{rotation: r},
	]);

export type Derivation =
	| "vertex"
	| "vertices"
	| "firstVertex"
	| "firstVertices"
	| "lastVertex"
	| "lastVertices"
	| "segmentStart"
	| "segmentStarts"
	| "intermediateSegmentStart"
	| "intermediateSegmentStarts"
	| "segmentEnd"
	| "segmentEnds"
	| "intermediateSegmentEnd"
	| "intermediateSegmentEnds"
	| "extrusionRoof"
	| "extrusionLitWalls"
	| "extrusionShadedWalls";

export type DerivationOptions = {
	/** Height of `extrusion*` derivations in map units (`extrusion-height`). */
	extrusionHeight?: number;
};

const EXTRUSION_PARTS: Partial<Record<string, ExtrusionPart>> = {
	extrusionRoof: "roof",
	extrusionLitWalls: "litWalls",
	extrusionShadedWalls: "shadedWalls",
};

export default function deriveGeometriesFromBase(
	base: Geometry,
	derivation: Derivation | GeometryType | null = null,
	{extrusionHeight = 0}: DerivationOptions = {},
): Array<GeometryWithMeta> {
	// early return for common case
	if (derivation === null) {
		return [[base, {}]];
	}

	const extrusionPart = EXTRUSION_PARTS[derivation];
	if (extrusionPart) {
		// Points, lines and flat blocks have no walls; their roof is the base.
		if (
			!(base instanceof Polygon || base instanceof MultiPolygon) ||
			!Number.isFinite(extrusionHeight) ||
			extrusionHeight <= 0
		) {
			return extrusionPart === "roof" ? [[base, {}]] : [];
		}
		return [[extrudeGeometry(base, extrusionHeight, extrusionPart), {}]];
	}

	if (base instanceof LineString) {
		switch (derivation) {
			case "vertex":
			case "vertices":
				return deriveLSVertexGeometries(base);
			case "firstVertex":
			case "firstVertices":
				return deriveLSVertexGeometries(base, "first");
			case "lastVertex":
			case "lastVertices":
				return deriveLSVertexGeometries(base, "last");
			case "segmentStart":
			case "segmentStarts":
				return deriveLSVertexGeometries(base, "start");
			case "intermediateSegmentStart":
			case "intermediateSegmentStarts":
				return deriveLSVertexGeometries(base, "start", "intermediate");
			case "segmentEnd":
			case "segmentEnds":
				return deriveLSVertexGeometries(base, "end");
			case "intermediateSegmentEnd":
			case "intermediateSegmentEnds":
				return deriveLSVertexGeometries(base, "end", "intermediate");
			default:
		}
	} else if (base instanceof Polygon) {
		// TODO: discriminate outer and inner ring
		switch (derivation) {
			case "vertex":
			case "vertices":
				return derivePolygonVertexGeometries(base);
			case "firstVertex":
			case "firstVertices":
				return derivePolygonVertexGeometries(base, "first");
			case "lastVertex":
			case "lastVertices":
				return derivePolygonVertexGeometries(base, "last");
			case "segmentStart":
			case "segmentStarts":
				return derivePolygonVertexGeometries(base, "start");
			case "intermediateSegmentStart":
			case "intermediateSegmentStarts":
				return derivePolygonVertexGeometries(
					base,
					"start",
					"intermediate",
				);
			case "segmentEnd":
			case "segmentEnds":
				return derivePolygonVertexGeometries(base, "end");
			case "intermediateSegmentEnd":
			case "intermediateSegmentEnds":
				return derivePolygonVertexGeometries(
					base,
					"end",
					"intermediate",
				);
			default:
		}
	}

	console.error(
		"Could not derive " + derivation + " from base geometry ",
		base,
	);

	return [[base, {}]];
}
