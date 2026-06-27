import Feature from "ol/Feature";
import GeometryCollection from "ol/geom/GeometryCollection";
import Point from "ol/geom/Point";
import Polygon from "ol/geom/Polygon";
import Fill from "ol/style/Fill";
import Style from "ol/style/Style";
import Text from "ol/style/Text";

import {expect, it} from "vitest";

import createCachedStyleFunction from "./createCachedStyleFunction.ts";

it("exposes geometry collection child indexes to style env and cache keys", () => {
	const styleFunction = createCachedStyleFunction({
		constructorsMap: {
			fill: Fill,
			style: Style,
			text: Text,
		},
		declarationHashFunction: (env, _props, envHash, geometryType) =>
			[
				envHash,
				geometryType,
				Number(env.geometryCollectionIndex),
				Number(env.geometryCollectionTypeIndex),
			].join("|"),
		declarationFunction: (env, _props, geometryType) => {
			if (geometryType === "Point") {
				return {
					default: {
						text: {
							text: {
								value: `${Number(env.geometryCollectionIndex)}:${Number(env.geometryCollectionTypeIndex)}`,
							},
						},
					},
				};
			}

			return {
				default: {
					fill: {
						color: {value: "#000"},
					},
				},
			};
		},
	});

	const feature = new Feature(
		new GeometryCollection([
			new Polygon([
				[
					[0, 0],
					[0, 1],
					[1, 1],
					[0, 0],
				],
			]),
			new Point([1, 1]),
			new Point([2, 2]),
		]),
	);

	const styles = styleFunction({}, feature) as Style[];
	const pointLabels = styles
		.map((style) => style.getText()?.getText())
		.filter((text): text is string => typeof text === "string");

	expect(pointLabels).toEqual(["1:0", "2:1"]);
});
