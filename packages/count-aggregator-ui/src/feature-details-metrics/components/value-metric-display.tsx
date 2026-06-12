import {formatMetricValue} from "../lib/format-metric-values.js";
import type {MetricWidgetConfig} from "../types.js";

type Props = {
	value: number | null;
	config: MetricWidgetConfig;
};

export default function ValueMetricDisplay({value, config}: Props) {
	if (value === null) {
		return (
			<div className="ms3-smart-city-metric__empty">
				Kein Messwert verfügbar
			</div>
		);
	}

	return (
		<div className="ms3-smart-city-metric__value">
			{formatMetricValue(value, config)}
		</div>
	);
}
