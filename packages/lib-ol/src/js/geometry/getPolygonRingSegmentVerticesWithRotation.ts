import type LinearRing from "ol/geom/LinearRing";
import type Polygon from "ol/geom/Polygon";

import {ensureNonNullable} from "@mapsight/lib-js/nonNullable";

import type {
	INTERMEDIATE_FILTER,
	RING_FILTER,
	VERTICES_FILTER,
	Vertex,
} from "../index";

function getLinearRingSegmentVerticesWithRotation(
	linearRing: LinearRing,
	verticesFilter: VERTICES_FILTER,
	intermediateFilter: INTERMEDIATE_FILTER,
) {
	const verticesWithRotation: Array<Vertex> = [];
	const ringCoords = linearRing.getCoordinates();

	ringCoords.forEach((start, i) => {
		const end = ringCoords[i + 1];
		if (!end) {
			return;
		}

		const isFirst = i === 0;
		const isLast = ringCoords[i + 2] === undefined;

		const dx = ensureNonNullable(end[0]) - ensureNonNullable(start[0]);
		const dy = ensureNonNullable(end[1]) - ensureNonNullable(start[1]);
		const rotation = -Math.round(Math.atan2(dy, dx) * 100) / 100;

		if (
			verticesFilter === "first"
				? isFirst
				: (verticesFilter === "start" || verticesFilter === "all") &&
					!(intermediateFilter === "intermediate" && isFirst)
		) {
			verticesWithRotation.push([[...start], rotation]);
		}

		if (
			verticesFilter === "last"
				? isLast
				: (verticesFilter === "end" || verticesFilter === "all") &&
					!(intermediateFilter === "intermediate" && isLast)
		) {
			verticesWithRotation.push([[...end], rotation]);
		}
	});

	return verticesWithRotation;
}

export default function getPolygonRingSegmentVerticesWithRotation(
	polygonGeometry: Polygon,
	verticesFilter: VERTICES_FILTER = "all",
	intermediateFilter: INTERMEDIATE_FILTER = "all",
	ringFilter: RING_FILTER = "all",
) {
	let verticesWithRotation: Array<Vertex> = [];

	if (ringFilter === "all" || ringFilter === "outer") {
		const outerRing = polygonGeometry.getLinearRing(0);
		if (outerRing) {
			verticesWithRotation = getLinearRingSegmentVerticesWithRotation(
				outerRing,
				verticesFilter,
				intermediateFilter,
			);
		}
	}

	if (ringFilter === "all" || ringFilter === "inner") {
		const innerRing = polygonGeometry.getLinearRing(1);
		if (innerRing) {
			verticesWithRotation = [
				...verticesWithRotation,
				...getLinearRingSegmentVerticesWithRotation(
					innerRing,
					verticesFilter,
					intermediateFilter,
				),
			];
		}
	}

	return verticesWithRotation;
}
