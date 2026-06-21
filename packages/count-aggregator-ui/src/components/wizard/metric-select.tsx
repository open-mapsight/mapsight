import {type ReactElement} from "react";

import type {BucketMetric} from "@mapsight/count-aggregator-api";

import {useCountAggregatorI18n} from "../../context/count-aggregator-provider.js";
import {getMetricLabels} from "../../lib/i18n.js";
import {Section} from "./section.js";

export function MetricSelect({
	selectedMetrics,
	availableMetrics,
	onChange,
}: {
	selectedMetrics: readonly BucketMetric[];
	availableMetrics: readonly BucketMetric[];
	onChange: (metrics: readonly BucketMetric[]) => void;
}): ReactElement {
	const {t} = useCountAggregatorI18n();
	const labels = getMetricLabels(t);

	const toggleMetric = (metric: BucketMetric) => {
		if (selectedMetrics.includes(metric)) {
			const next = selectedMetrics.filter((entry) => entry !== metric);
			if (next.length > 0) {
				onChange(next);
			}

			return;
		}

		onChange([...selectedMetrics, metric]);
	};

	return (
		<Section title={t("metric.section")}>
			<div className="msca:flex msca:flex-wrap msca:gap-3">
				{availableMetrics.map((metric) => {
					const isSelected = selectedMetrics.includes(metric);

					return (
						<label
							key={metric}
							className="msca:inline-flex msca:cursor-pointer msca:items-center msca:gap-2 msca:text-sm"
						>
							<input
								type="checkbox"
								checked={isSelected}
								onChange={() => {
									toggleMetric(metric);
								}}
							/>
							<span>{labels[metric]}</span>
						</label>
					);
				})}
			</div>
		</Section>
	);
}
