import {useEffect, useMemo} from "react";

import GeoJSON from "ol/format/GeoJSON";
import {getLength} from "ol/sphere";

import type {Feature} from "geojson";

import {announceStatus} from "../../helpers/announce-status";
import {getDocumentLanguage, translate} from "../../helpers/i18n";

const geoJsonFormat = new GeoJSON();
export function formatLength(length: number) {
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

	return <MeasurementOutput value={formattedValue} />;
}

/** Labelled distance output, laid out like the share tool's labelled link. */
export function MeasurementOutput({value}: {value: string | null}) {
	return (
		<p className="ms3-measure-distance ms3-tool-overlay__output">
			<span className="ms3-tool-overlay__output-label">
				{translate("ui.measure-distance.measurement")}
			</span>{" "}
			<span className="ms3-tool-overlay__output-value">{value}</span>
		</p>
	);
}

export default MeasureDistanceInfo;
