import type LineString from "ol/geom/LineString";

import {ensureNonNullable} from "@mapsight/lib-js/nonNullable";

import equals from "../coordinates/equals";
import type {INTERMEDIATE_FILTER, VERTICES_FILTER, Vertex} from "../index";

export default function getLineStringSegmentVerticesWithRotation(
	lineStringGeometry: LineString,
	verticesFilter: VERTICES_FILTER = "all",
	intermediateFilter: INTERMEDIATE_FILTER = "all",
) {
	const verticesWithRotation: Array<Vertex> = [];
	const first = lineStringGeometry.getFirstCoordinate();
	const last = lineStringGeometry.getLastCoordinate();

	lineStringGeometry.forEachSegment(function processSegment(start, end) {
		const dx = ensureNonNullable(end[0]) - ensureNonNullable(start[0]);
		const dy = ensureNonNullable(end[1]) - ensureNonNullable(start[1]);
		const rotation = -Math.round(Math.atan2(dy, dx) * 100) / 100;

		if (
			verticesFilter === "first"
				? equals(start, first)
				: (verticesFilter === "start" || verticesFilter === "all") &&
					!(
						intermediateFilter === "intermediate" &&
						equals(start, first)
					)
		) {
			verticesWithRotation.push([[...start], rotation]);
		}

		if (
			verticesFilter === "last"
				? equals(end, last)
				: (verticesFilter === "end" || verticesFilter === "all") &&
					!(
						intermediateFilter === "intermediate" &&
						equals(end, last)
					)
		) {
			verticesWithRotation.push([[...end], rotation]);
		}
	});

	return verticesWithRotation;
}
