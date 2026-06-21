import {
	getCountAggregatorDictionary,
	resolveCountAggregatorLocale,
} from "../../lib/i18n.js";
import {getDocumentLocale} from "../../lib/utils.js";
import {formatMetricValueFromConfig} from "../lib/format-metric-values.js";
import type {MetricWidgetConfig} from "../types.js";

type Props = {
	value: number | null;
	config: MetricWidgetConfig;
};

export default function ValueMetricDisplay({value, config}: Props) {
	if (value === null) {
		const dictionary = getCountAggregatorDictionary(
			resolveCountAggregatorLocale(getDocumentLocale()),
		);

		return (
			<div className="ms3-smart-city-metric__empty">
				{dictionary["metrics.emptyValue"]}
			</div>
		);
	}

	return (
		<div className="ms3-smart-city-metric__value">
			{formatMetricValueFromConfig(value, config)}
		</div>
	);
}
