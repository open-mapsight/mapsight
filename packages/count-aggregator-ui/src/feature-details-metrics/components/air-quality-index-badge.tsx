import type {CSSProperties} from "react";

import {
	airQualityIndexBandLabel,
	resolveAirQualityIndexBand,
} from "@mapsight/count-aggregator-api";

import {
	type CountAggregatorLocale,
	resolveCountAggregatorLocale,
} from "../../lib/i18n.js";
import {getDocumentLocale} from "../../lib/utils.js";

type Props = {
	value: number;
	locale?: CountAggregatorLocale;
};

export default function AirQualityIndexBadge({value, locale}: Props) {
	const resolvedLocale =
		locale ?? resolveCountAggregatorLocale(getDocumentLocale());
	const band = resolveAirQualityIndexBand(value);
	if (band === undefined) {
		return null;
	}

	const label =
		airQualityIndexBandLabel(value, resolvedLocale) ?? band.labelDe;

	return (
		<div
			className="ms3-smart-city-metric__aqi-badge"
			style={
				{
					"--ms3-aqi-color": band.color,
				} as CSSProperties
			}
			data-aqi-band={band.id}
			data-aqi-key={band.key}
		>
			<span className="ms3-smart-city-metric__aqi-swatch" aria-hidden />
			<span className="ms3-smart-city-metric__aqi-label">{label}</span>
		</div>
	);
}
