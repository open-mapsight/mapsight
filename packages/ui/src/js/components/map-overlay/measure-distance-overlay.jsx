import {useEffect, useMemo} from "react";

import GeoJSON from "ol/format/GeoJSON";
import {getLength} from "ol/sphere";

import {announceStatus} from "../../helpers/announce-status";
import {getDocumentLanguage, translate} from "../../helpers/i18n";

const geoJsonFormat = new GeoJSON();
function formatLength(length) {
	const isKilometer = length > 1000;
	const format = new Intl.NumberFormat(getDocumentLanguage(), {
		style: "unit",
		maximumFractionDigits: 2,
		unit: isKilometer ? "kilometer" : "meter",
	});
	return format.format(isKilometer ? length / 1000 : length);
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

	const formattedValue = geometry ? formatLength(getLength(geometry)) : null;
	useEffect(() => {
		if (formattedValue) {
			announceStatus(
				`${translate("ui.measure-distance.measurement")}: ${formattedValue}`,
			);
		}
	}, [formattedValue, fGeo]);

	if (!geometry) {
		return null;
	}

	return (
		<div className="ms3-measure-distance">
			{translate("ui.measure-distance.measurement")}
			{": "}
			{formattedValue}
		</div>
	);
}

export default MeasureDistanceInfo;
