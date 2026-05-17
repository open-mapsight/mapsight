import GeoJSON from "ol/format/GeoJSON";

import {getLength} from "ol/sphere";
import  {useMemo} from "react";

import {translate} from "../../helpers/i18n";

const geoJsonFormat = new GeoJSON();
const meterFormat = new Intl.NumberFormat(undefined, {
	style: "unit",
	maximumFractionDigits: 2,
	unit: "meter",
});
const kilometerFormat = new Intl.NumberFormat(undefined, {
	style: "unit",
	maximumFractionDigits: 2,
	unit: "kilometer",
});

function formatLength(length) {
	const isKilometer = length > 1000;
	const format = isKilometer ? kilometerFormat : meterFormat;
	const amount = isKilometer ? length / 1000 : length;
	return format.format(amount);
}

function MeasureDistanceInfo({feature}) {
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
