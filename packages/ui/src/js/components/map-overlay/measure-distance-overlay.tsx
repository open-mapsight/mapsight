import {useMemo} from "react";

import GeoJSON from "ol/format/GeoJSON";
import {getLength} from "ol/sphere";

import type {Feature} from "geojson";

import {getDocumentLanguage, translate} from "../../helpers/i18n";

const geoJsonFormat = new GeoJSON();
function formatLength(length: number) {
	const isKilometer = length > 1000;
	const format = new Intl.NumberFormat(getDocumentLanguage(), {
		style: "unit",
		maximumFractionDigits: 2,
		unit: isKilometer ? "kilometer" : "meter",
	});
	return format.format(isKilometer ? length / 1000 : length);
}

function MeasureDistanceInfo({feature}: {feature?: Partial<Feature> | null}) {
	const fGeo = feature?.geometry;
	const geometry = useMemo(() => {
		if (fGeo?.type !== "LineString") {
			return null;
		}

		return geoJsonFormat.readGeometry(fGeo, {
			featureProjection: "EPSG:3857",
			dataProjection: "EPSG:4326",
		});
	}, [fGeo]);

	if (!geometry) {
		return null;
	}

	const length = getLength(geometry);
	const formattedValue = formatLength(length);

	return (
		<div className="ms3-measure-distance">
			{translate("ui.measure-distance.measurement")}
			{": "}
			{formattedValue}
		</div>
	);
}

export default MeasureDistanceInfo;
